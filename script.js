// script.js

// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, doc, deleteDoc, addDoc,setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);

// Data and state variables
const incomeCategories = [
  "Salary", "Gift", "Bonus", "Interest", "Business Income", "Others"
];
const expenseCategories = [
  "Food", "Transport", "Utilities", "Cash Withdraw", "Health", "Loans", "Clothing",
  "Household", "Savings", "Entertainment", "Others"
];

let transactions = [];
let deletedTxnData = null; // Stored for undo functionality
let currentUserId = null; // Will hold the UID of the logged-in user
let incomeChart, expenseChart;

// Utility functions
function formatAmount(amount) {
  return parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Function to handle fetching and rendering transactions based on user auth state
function setupRealtimeListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in. Set the current user ID and listen for their transactions.
      currentUserId = user.uid;
      const userTransactionsRef = collection(db, "users", currentUserId, "transactions");
      
      onSnapshot(query(userTransactionsRef), (querySnapshot) => {
        transactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        renderDashboard(); // Re-render the dashboard whenever transactions change
      }, (error) => {
        console.error("Error listening to user transactions: ", error);
        alert("Failed to load your transactions. Please try again.");
      });
    } else {
      // User is signed out. Clear data and redirect to login page.
      currentUserId = null;
      transactions = [];
      renderDashboard(); // Clear the dashboard
      window.location.href = "index.html";
    }
  });
}

function populateCategoryFilter() {
  const filter = document.getElementById("filterCategory");
  const categories = [
    ...new Set(transactions.map((t) => t.category).filter(Boolean)),
  ];
  filter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });
}

function filterTransactions() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const filterCategory = document.getElementById("filterCategory").value;
  const amountRangeStr = document.getElementById("amountRange").value.trim();

  let minAmount = null, maxAmount = null;
  if (amountRangeStr) {
    const parts = amountRangeStr.split("-");
    if (parts.length === 2) {
      minAmount = parseFloat(parts[0]);
      maxAmount = parseFloat(parts[1]);
    }
  }

  return transactions.filter((t) => {
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    if (filterCategory && t.category !== filterCategory) return false;

    const amount = parseFloat(t.amount);
    if (minAmount !== null && !isNaN(minAmount) && amount < minAmount) return false;
    if (maxAmount !== null && !isNaN(maxAmount) && amount > maxAmount) return false;

    return true;
  });
}

function renderCharts(filteredTxns) {
  const incomeData = {};
  const expenseData = {};
  filteredTxns.forEach((t) => {
    if (t.type === "Income") {
      incomeData[t.category] = (incomeData[t.category] || 0) + parseFloat(t.amount);
    } else if (t.type === "Expense") {
      expenseData[t.category] = (expenseData[t.category] || 0) + parseFloat(t.amount);
    }
  });

  const incomeLabels = Object.keys(incomeData);
  const incomeAmounts = incomeLabels.map((cat) => incomeData[cat]);
  const expenseLabels = Object.keys(expenseData);
  const expenseAmounts = expenseLabels.map((cat) => expenseData[cat]);
  if (incomeChart) incomeChart.destroy();
  if (expenseChart) expenseChart.destroy();
  const incomeCtx = document.getElementById("incomeChart").getContext("2d");
  incomeChart = new Chart(incomeCtx, {
    type: "doughnut",
    data: {
      labels: incomeLabels,
      datasets: [
        {
          label: "Income",
          data: incomeAmounts,
          backgroundColor: incomeLabels.map(() => "#28A745cc"),
          borderColor: incomeLabels.map(() => "#ffffff"),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Income Breakdown" },
      },
    },
  });
  const expenseCtx = document.getElementById("expenseChart").getContext("2d");
  expenseChart = new Chart(expenseCtx, {
    type: "doughnut",
    data: {
      labels: expenseLabels,
      datasets: [
        {
          label: "Expense",
          data: expenseAmounts,
          backgroundColor: expenseLabels.map(() => "#cc0000cc"),
          borderColor: expenseLabels.map(() => "#ffffff"),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Expense Breakdown" },
      },
    },
  });
}

function renderSummaryTable(filteredTxns) {
  const summaryDiv = document.getElementById("summaryTable");
  let totalIncome = 0;
  let totalExpense = 0;
  filteredTxns.forEach((t) => {
    if (t.type === "Income") totalIncome += parseFloat(t.amount);
    else if (t.type === "Expense") totalExpense += parseFloat(t.amount);
  });
  summaryDiv.innerHTML = `
    <div class="mb-4">
      <h4>Summary</h4>
      <p><strong>Total Income:</strong> Rs.${formatAmount(totalIncome)}</p>
      <p><strong>Total Expense:</strong> Rs.${formatAmount(totalExpense)}</p>
      <p><strong>Balance:</strong> Rs.${formatAmount(totalIncome - totalExpense)}</p>
    </div>
  `;
}

function renderRecentTransactions() {
  const recentUl = document.getElementById("recentTransactions");
  recentUl.innerHTML = "";
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 10);
  recent.forEach((t) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center " +
      (t.type === "Income" ? "income-row" : "expense-row");
    li.innerHTML = `
      <div>
        <strong>${t.type}</strong> - ${t.category} <br />
        <small>${t.date}</small><br />
        <small>${t.comment || ""}</small>
      </div>
      <span>Rs.${formatAmount(t.amount)}</span>
    `;
    recentUl.appendChild(li);
  });
}

// Main rendering function to be called after data is fetched
function renderDashboard() {
  const filtered = filterTransactions();
  populateCategoryFilter();
  renderCharts(filtered);
  renderSummaryTable(filtered);
  renderRecentTransactions();
}

// Function to show the "undo" toast
function showUndoToast() {
  const undoToast = document.getElementById("undoToast");
  if (undoToast) {
    undoToast.style.display = "block";
    setTimeout(() => {
      undoToast.style.display = "none";
      deletedTxnData = null; // Clear the data if not undone
    }, 5000);
  }
}

// Function to handle deleting a transaction
async function deleteTxn(docId) {
  if (!currentUserId) {
    alert("You must be logged in to delete transactions.");
    return;
  }
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      const txnToDelete = transactions.find(t => t.id === docId);
      if (txnToDelete) {
        deletedTxnData = { ...txnToDelete };
      }
      await deleteDoc(doc(db, "users", currentUserId, "transactions", docId));
      showUndoToast();
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Failed to delete transaction. Please try again.");
    }
  }
}

// Function to handle undoing a deletion
async function undoDelete() {
  if (deletedTxnData && currentUserId) {
    try {
      const { id, ...txnDataWithoutId } = deletedTxnData;
      await addDoc(collection(db, "users", currentUserId, "transactions"), txnDataWithoutId);
      document.getElementById("undoToast").style.display = "none";
      deletedTxnData = null;
      alert("Transaction restored successfully.");
    } catch (e) {
      console.error("Error restoring transaction: ", e);
      alert("Failed to restore transaction. Please try again.");
    }
  }
}

// Function to handle exporting transactions as CSV
function exportTransactions() {
  if (!transactions.length) {
    alert("No transactions to export.");
    return;
  }
  let csv = "Type,Category,Amount,Date,Comment\n";
  transactions.forEach((t) => {
    const comment = t.comment ? `"${t.comment.replace(/"/g, '""')}"` : "";
    csv += `${t.type},${t.category},${t.amount},${t.date},${comment}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to filter data (called by the "Apply Filters" button)
function filterData() {
  const filtered = filterTransactions();
  renderCharts(filtered);
  renderSummaryTable(filtered);
  renderRecentTransactions();
}

// Initialization on page load
window.onload = () => {
  setupRealtimeListener();
};

// Make functions available globally
window.filterData = filterData;
window.exportTransactions = exportTransactions;
window.deleteTxn = deleteTxn;
window.undoDelete = undoDelete;