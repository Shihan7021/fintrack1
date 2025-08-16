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

// Initialize auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
    } else {
        window.location.href = "index.html";
    }
});

// File upload handler
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('statementFile');
    const accountType = document.getElementById('accountType').value;
    
    if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        console.log('Starting file processing...');
        let transactions = [];
        
        if (file.name.endsWith('.csv')) {
            console.log('Processing CSV file...');
            transactions = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            console.log('Processing Excel file...');
            transactions = await parseExcel(file);
        } else {
            throw new Error('Unsupported file format');
        }

        console.log('Raw data extracted:', transactions);
        console.log('Number of rows:', transactions.length);

        // Process and classify transactions
        parsedTransactions = await processTransactions(transactions);
        console.log('Processed transactions:', parsedTransactions);
        
        // Show preview
        displayPreview(parsedTransactions);
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file: ' + error.message);
    } finally {
        loadingModal.hide();
    }
});

// Parse CSV file
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

// Parse Excel file
function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsArrayBuffer(file);
    });
}

// Process and classify transactions
async function processTransactions(rawData) {
    const processed = [];
    
    for (const row of rawData) {
        // Try to extract data from various possible column names
        const date = findColumnValue(row, ['date', 'Date', 'DATE', 'Transaction Date', 'transaction_date']);
        const description = findColumnValue(row, ['description', 'Description', 'DESCRIPTION', 'Description', 'Details', 'details', 'Narration']);
        const amount = findColumnValue(row, ['amount', 'Amount', 'AMOUNT', 'Amount', 'Debit', 'Credit', 'Withdrawal', 'Deposit']);
        const type = findColumnValue(row, ['type', 'Type', 'TYPE', 'Transaction Type', 'transaction_type']);
        
        if (!date || !description || !amount) {
            console.warn('Skipping row with missing required fields:', row);
            continue;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            console.warn('Skipping row with invalid amount:', amount);
            continue;
        }

        // Determine transaction type
        let transactionType = 'Expense';
        if (numericAmount > 0) {
            transactionType = 'Income';
        }

        // Auto-categorize based on description
        const category = autoCategorize(description);

        processed.push({
            date: formatDate(date),
            description: description.trim(),
            amount: Math.abs(numericAmount).toFixed(2),
            type: transactionType,
            category: category,
            comment: `Imported from bank statement: ${description}`
        });
    }

    return processed;
}

// Find column value by trying multiple possible column names
function findColumnValue(row, possibleNames) {
    for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
        }
    }
    return null;
}

// Auto-categorize transactions based on description keywords
function autoCategorize(description) {
    const lowerDesc = description.toLowerCase();
    
    const categories = {
        'Salary': ['salary', 'payroll', 'wage', 'income', 'remuneration'],
        'Food': ['food', 'restaurant', 'grocery', 'supermarket', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonald', 'kfc'],
        'Transport': ['uber', 'grab', 'taxi', 'fuel', 'petrol', 'gas', 'bus', 'train', 'metro', 'parking'],
        'Utilities': ['electricity', 'water', 'internet', 'phone', 'telecom', 'utility'],
        'Health': ['pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'medicine', 'health'],
        'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'entertainment', 'game'],
        'Shopping': ['amazon', 'ebay', 'shopping', 'clothing', 'fashion', 'electronics'],
        'Cash Withdraw': ['atm', 'withdrawal', 'cash', 'wdl'],
        'Loans': ['loan', 'mortgage', 'emi', 'interest', 'credit card'],
        'Others': []
    };

    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (lowerDesc.includes(keyword)) {
                return category;
            }
        }
    }

    return 'Others';
}

// Format date to YYYY-MM-DD
function formatDate(dateValue) {
    if (!dateValue) return null;
    
    let date;
    
    // Handle Excel serial dates
    if (typeof dateValue === 'number') {
        date = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
        date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
}

// Display preview table
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

// Get category options based on transaction type
function getCategoryOptions(type, currentCategory) {
    const incomeCategories = ["Salary", "Gift", "Bonus", "Interest", "Business Income", "Others"];
    const expenseCategories = ["Food", "Transport", "Utilities", "Cash Withdraw", "Health", "Loans", "Clothing", "Household", "Savings", "Entertainment", "Others"];
    
    const categories = type === 'Income' ? incomeCategories : expenseCategories;
    
    return categories
        .filter(cat => cat !== currentCategory)
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

// Cancel upload
function cancelUpload() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadForm').reset();
    parsedTransactions = [];
}

// Confirm and save transactions
async function confirmUpload() {
    if (!parsedTransactions.length) {
        alert('No transactions to save');
        return;
    }

    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        // Update categories from preview
        parsedTransactions.forEach((transaction, index) => {
            const categorySelect = document.getElementById(`category-${index}`);
            if (categorySelect) {
                transaction.category = categorySelect.value;
            }
        });

        // Save to Firestore
        const promises = [];
        for (const transaction of parsedTransactions) {
            const docData = {
                type: transaction.type,
                category: transaction.category,
                amount: transaction.amount,
                date: transaction.date,
                comment: transaction.comment,
                createdAt: serverTimestamp()
            };
            
            promises.push(addDoc(collection(db, "users", currentUserId, "transactions"), docData));
        }

        await Promise.all(batch);
        
        alert(`Successfully imported ${parsedTransactions.length} transactions!`);
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Error saving transactions:', error);
        alert('Error saving transactions: ' + error.message);
    } finally {
        loadingModal.hide();
    }
}

// Logout handler
document.getElementById('logoutButton').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});
