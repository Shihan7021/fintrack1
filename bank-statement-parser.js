// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAl8wXLzjuHGHohU70LOoObJ7OZUhHpWDQ",
    authDomain: "finsight-567f4.firebaseapp.com",
    projectId: "finsight-567f4",
    storageBucket: "finsight-567f4.firebasestorage.app",
    messagingSenderId: "329662315678",
    appId: "1:329662315678:web:735fbacbca2818e0674f8f",
    measurementId: "G-3BYVY6PE64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null;
let parsedTransactions = [];

// Auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
    } else {
        window.location.href = "index.html";
    }
});

// Handle form submit
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('statementFile');
    if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        let transactions = [];
        
        if (file.name.endsWith('.csv')) {
            transactions = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            transactions = await parseExcel(file);
        } else {
            throw new Error('Unsupported file format');
        }

        console.log("Parsed file rows:", transactions);

        parsedTransactions = await processTransactions(transactions);
        console.log('Processed transactions:', parsedTransactions);

        displayPreview(parsedTransactions);
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file: ' + error.message);
    } finally {
        loadingModal.hide();
    }
});

// ==============================
// CSV Parser
// ==============================
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
        });
    });
}

// ==============================
// Excel Parser (fixed)
// ==============================
function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Use header: 1 to get raw data, then process headers properly
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                
                if (rawData.length < 2) {
                    return resolve([]);
                }

                // Find the first row with actual headers (skip empty rows)
                let headerRowIndex = 0;
                for (let i = 0; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (row && row.some(cell => cell && cell.toString().trim())) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const headers = rawData[headerRowIndex].map(h => h ? String(h).trim() : "");
                
                // Convert data rows to objects using proper headers
                const dataRows = rawData.slice(headerRowIndex + 1);
                const transactions = dataRows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        if (header && header !== "") {
                            obj[header] = row[index] !== undefined ? row[index] : "";
                        }
                    });
                    return obj;
                });

                // Filter out empty rows
                const validTransactions = transactions.filter(row => {
                    return Object.values(row).some(value => 
                        value !== "" && value != null && value !== 0
                    );
                });

                console.log("Parsed Excel transactions:", validTransactions);
                resolve(validTransactions);

            } catch (error) {
                console.error("Excel parsing error:", error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsArrayBuffer(file);
    });
}

// ==============================
// Process Transactions
// ==============================
async function processTransactions(rawData) {
    const processed = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        const date = findColumnValue(row, ['date', 'Date', 'Transaction Date', 'Txn Date']);
        const description = findColumnValue(row, ['description', 'Description', 'Details', 'Narration', 'Remarks', 'Payee', 'Merchant']);
        const amount = findColumnValue(row, ['amount', 'Amount', 'Debit', 'Credit', 'Withdrawal', 'Deposit']);
        const type = findColumnValue(row, ['type', 'Type', 'Transaction Type', 'Debit/Credit', 'Dr/Cr']);

        if (!date || !description || !amount) continue;

        let numericAmount = parseFloat(String(amount).replace(/[Rs,$\s]/g, ''));
        if (isNaN(numericAmount)) continue;

        let transactionType = 'Expense';
        if (type && /credit|cr/i.test(type)) transactionType = 'Income';
        else if (type && /debit|dr/i.test(type)) transactionType = 'Expense';
        else if (numericAmount > 0) transactionType = 'Income';

        const finalAmount = Math.abs(numericAmount);
        const category = autoCategorize(description);

        processed.push({
            date: formatDate(date),
            description: description.trim(),
            amount: finalAmount.toFixed(2),
            type: transactionType,
            category: category,
            comment: `Imported from bank statement: ${description}`
        });
    }

    return processed;
}

// ==============================
// Helper Functions
// ==============================
function findColumnValue(row, possibleNames) {
    for (const name of possibleNames) {
        for (const key of Object.keys(row)) {
            if (key.trim().toLowerCase() === name.trim().toLowerCase()) {
                return row[key];
            }
        }
    }
    return null;
}

function autoCategorize(description) {
    const lowerDesc = description.toLowerCase();
    const categories = {
        'Salary': ['salary', 'payroll', 'wage'],
        'Food': ['food', 'restaurant', 'grocery', 'supermarket', 'cafe'],
        'Transport': ['uber', 'fuel', 'bus', 'train', 'taxi'],
        'Utilities': ['electricity', 'water', 'internet', 'phone'],
        'Health': ['pharmacy', 'medical', 'hospital'],
        'Entertainment': ['netflix', 'spotify', 'movie', 'cinema'],
        'Shopping': ['amazon', 'shopping', 'clothing', 'electronics'],
        'Cash Withdraw': ['atm', 'withdrawal', 'cash'],
        'Loans': ['loan', 'mortgage', 'emi', 'interest'],
        'Others': []
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }
    return 'Others';
}

function formatDate(dateValue) {
    if (!dateValue) return null;
    let date;
    if (typeof dateValue === 'number') {
        date = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
        date = new Date(dateValue);
    }
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
}

// ==============================
// Preview + Save
// ==============================
function displayPreview(transactions) {
    const previewSection = document.getElementById('previewSection');
    const tbody = document.getElementById('previewTableBody');
    tbody.innerHTML = '';

    transactions.forEach((transaction, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.description}</td>
            <td>Rs.${parseFloat(transaction.amount).toLocaleString()}</td>
            <td>${transaction.type}</td>
            <td>
                <select class="form-select form-select-sm" id="category-${index}">
                    <option value="${transaction.category}" selected>${transaction.category}</option>
                    ${getCategoryOptions(transaction.type, transaction.category)}
                </select>
            </td>
        `;
    });

    previewSection.style.display = 'block';
}

function getCategoryOptions(type, currentCategory) {
    const incomeCategories = ["Salary", "Gift", "Bonus", "Interest", "Business Income", "Others"];
    const expenseCategories = ["Food", "Transport", "Utilities", "Cash Withdraw", "Health", "Loans", "Clothing", "Household", "Savings", "Entertainment", "Others"];
    const categories = type === 'Income' ? incomeCategories : expenseCategories;

    return categories
        .filter(cat => cat !== currentCategory)
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

function cancelUpload() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadForm').reset();
    parsedTransactions = [];
}

async function confirmUpload() {
    if (!parsedTransactions.length) {
        alert('No transactions to save');
        return;
    }

    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        parsedTransactions.forEach((transaction, index) => {
            const categorySelect = document.getElementById(`category-${index}`);
            if (categorySelect) {
                transaction.category = categorySelect.value;
            }
        });

        const promises = parsedTransactions.map(transaction => {
            return addDoc(collection(db, "users", currentUserId, "transactions"), {
                type: transaction.type,
                category: transaction.category,
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                comment: transaction.comment,
                createdAt: serverTimestamp()
            });
        });

        await Promise.all(promises);
        alert(`Successfully imported ${parsedTransactions.length} transactions!`);
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error saving transactions:', error);
        alert('Error saving transactions: ' + error.message);
    } finally {
        loadingModal.hide();
    }
}

// ==============================
// Logout
// ==============================
document.getElementById('logoutButton').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});
