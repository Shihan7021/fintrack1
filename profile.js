// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let deleteStep = 1;

// Category definitions
const incomeCategories = ["Salary", "Gift", "Bonus", "Interest", "Business Income", "Others"];
const expenseCategories = ["Food", "Transport", "Utilities", "Cash Withdraw", "Health", "Loans", "Clothing", "Household", "Savings", "Entertainment", "Others"];

// Track categories with transactions
let categoriesWithTransactions = {
    income: new Set(),
    expense: new Set()
};

// Track custom categories
let customCategories = {
    income: [],
    expense: []
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    showLoading(true);
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadUserProfile();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Form submission
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    
    // Logout button
    document.getElementById('logoutButton').addEventListener('click', logout);
});

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const content = document.querySelector('.container');
    
    if (show) {
        spinner.style.display = 'block';
        content.style.opacity = '0.5';
    } else {
        spinner.style.display = 'none';
        content.style.opacity = '1';
    }
}

// Load user profile data
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        // Load user profile data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Populate form fields
            document.getElementById('profileEmail').value = currentUser.email || '';
            document.getElementById('profileProfession').value = userData.profession || '';
            document.getElementById('profileAgeRange').value = userData.ageRange || '';
            document.getElementById('profileCountry').value = userData.country || '';
            document.getElementById('profileIncomeRange').value = userData.incomeRange || '';
            document.getElementById('profileCycleDate').value = userData.cycleDate || '';

            // Load custom categories
            customCategories.income = userData.customIncomeCategories || [];
            customCategories.expense = userData.customExpenseCategories || [];

            // Check for existing transactions
            await checkExistingTransactions(currentUser.uid);

            // Load selected categories
            const selectedIncome = userData.selectedIncomeCategories || [...incomeCategories, ...customCategories.income];
            const selectedExpense = userData.selectedExpenseCategories || [...expenseCategories, ...customCategories.expense];

            // Populate categories
            populateCategories('income', [...incomeCategories, ...customCategories.income], selectedIncome);
            populateCategories('expense', [...expenseCategories, ...customCategories.expense], selectedExpense);
        } else {
            // Default setup for new users
            populateCategories('income', incomeCategories, incomeCategories);
            populateCategories('expense', expenseCategories, expenseCategories);
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('error', 'Failed to load profile. Please refresh the page.');
        showLoading(false);
    }
}

// Check for existing transactions
async function checkExistingTransactions(userId) {
    try {
        const transactionsRef = collection(db, "users", userId, "transactions");
        const snapshot = await getDocs(transactionsRef);
        
        snapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.type === "Income" && transaction.category) {
                categoriesWithTransactions.income.add(transaction.category);
            } else if (transaction.type === "Expense" && transaction.category) {
                categoriesWithTransactions.expense.add(transaction.category);
            }
        });
    } catch (error) {
        console.error("Error checking transactions:", error);
    }
}

// Populate categories with checkboxes
function populateCategories(type, allCategories, selectedCategories) {
    const container = document.getElementById(`${type}CategoriesList`);
    container.innerHTML = '';

    allCategories.forEach(category => {
        const hasTransactions = type === 'income' 
            ? categoriesWithTransactions.income.has(category)
            : categoriesWithTransactions.expense.has(category);
        
        const isSelected = selectedCategories.includes(category);
        const isCustom = (type === 'income' ? customCategories.income : customCategories.expense).includes(category);

        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input category-checkbox" type="checkbox" 
                       id="${type}_${category}" 
                       value="${category}" 
                       ${isSelected ? 'checked' : ''}
                       ${hasTransactions ? 'disabled' : ''}>
                <label class="form-check-label ${hasTransactions ? 'text-muted' : ''}" for="${type}_${category}">
                    ${category}
                    ${hasTransactions ? '<small class="text-muted">(has transactions)</small>' : ''}
                    ${isCustom ? '<span class="badge bg-primary ms-2">Custom</span>' : ''}
                </label>
                ${isCustom ? `<button type="button" class="btn btn-sm btn-link text-danger delete-btn float-end" onclick="removeCustomCategory('${type}', '${category}')">
                    <i class="fas fa-times"></i>
                </button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Add custom category
window.addCustomCategory = function(type) {
    const input = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Category`);
    const category = input.value.trim();
    
    if (!category) {
        showMessage('error', 'Please enter a category name');
        return;
    }
    
    if (category.length < 2) {
        showMessage('error', 'Category name must be at least 2 characters');
        return;
    }
    
    const allCategories = type === 'income' 
        ? [...incomeCategories, ...customCategories.income]
        : [...expenseCategories, ...customCategories.expense];
        
    if (allCategories.includes(category)) {
        showMessage('error', 'This category already exists');
        return;
    }
    
    if (type === 'income') {
        customCategories.income.push(category);
    } else {
        customCategories.expense.push(category);
    }
    
    // Refresh category lists
    const selectedCategories = Array.from(document.querySelectorAll(`#${type}CategoriesList input[type="checkbox"]:checked`))
        .map(cb => cb.value);
    selectedCategories.push(category);
    
    populateCategories(type, 
        type === 'income' 
            ? [...incomeCategories, ...customCategories.income]
            : [...expenseCategories, ...customCategories.expense], 
        selectedCategories);
    
    input.value = '';
    showMessage('success', `Custom ${type} category added: ${category}`);
};

// Remove custom category
window.removeCustomCategory = function(type, category) {
    const hasTransactions = type === 'income' 
        ? categoriesWithTransactions.income.has(category)
        : categoriesWithTransactions.expense.has(category);
        
    if (hasTransactions) {
        showMessage('error', 'Cannot remove category with existing transactions');
        return;
    }
    
    if (confirm(`Are you sure you want to remove the custom category "${category}"?`)) {
        if (type === 'income') {
            customCategories.income = customCategories.income.filter(c => c !== category);
        } else {
            customCategories.expense = customCategories.expense.filter(c => c !== category);
        }
        
        // Refresh category lists
        const selectedCategories = Array.from(document.querySelectorAll(`#${type}CategoriesList input[type="checkbox"]:checked`))
            .map(cb => cb.value)
            .filter(c => c !== category);
        
        populateCategories(type, 
            type === 'income' 
                ? [...incomeCategories, ...customCategories.income]
                : [...expenseCategories, ...customCategories.expense], 
            selectedCategories);
        
        showMessage('success', `Custom ${type} category removed: ${category}`);
    }
};

// Save profile
async function saveProfile(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const saveBtn = e.target.querySelector('button[type="submit"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    saveBtn.disabled = true;
    
    try {
        const profileData = {
            email: currentUser.email,
            profession: document.getElementById('profileProfession').value,
            ageRange: document.getElementById('profileAgeRange').value,
            country: document.getElementById('profileCountry').value,
            incomeRange: document.getElementById('profileIncomeRange').value,
            cycleDate: document.getElementById('profileCycleDate').value,
            customIncomeCategories: customCategories.income,
            customExpenseCategories: customCategories.expense,
            selectedIncomeCategories: Array.from(document.querySelectorAll('#incomeCategoriesList input[type="checkbox"]:checked')).map(cb => cb.value),
            selectedExpenseCategories: Array.from(document.querySelectorAll('#expenseCategoriesList input[type="checkbox"]:checked')).map(cb => cb.value),
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });
        
        showMessage('success', 'Profile updated successfully!');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage('error', 'Failed to save profile. Please try again.');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Save categories
window.saveCategories = async function() {
    if (!currentUser) return;
    
    const saveBtn = document.querySelector('button[onclick="saveCategories()"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    saveBtn.disabled = true;
    
    try {
        const selectedIncome = Array.from(document.querySelectorAll('#incomeCategoriesList input[type="checkbox"]:checked')).map(cb => cb.value);
        const selectedExpense = Array.from(document.querySelectorAll('#expenseCategoriesList input[type="checkbox"]:checked')).map(cb => cb.value);
        
        await setDoc(doc(db, "users", currentUser.uid), {
            selectedIncomeCategories: selectedIncome,
            selectedExpenseCategories: selectedExpense,
            customIncomeCategories: customCategories.income,
            customExpenseCategories: customCategories.expense,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        showMessage('success', 'Categories saved successfully!');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    } catch (error) {
        console.error('Error saving categories:', error);
        showMessage('error', 'Failed to save categories. Please try again.');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
};

// Show message
function showMessage(type, message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');
    const messageText = type === 'success' ? document.getElementById('successText') : document.getElementById('errorText');
    
    if (type === 'success') {
        messageText.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        setTimeout(() => successDiv.style.display = 'none', 5000);
    } else {
        messageText.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

// Logout
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
            showMessage('error', 'Failed to logout. Please try again.');
        }
    }
}

// Delete account steps
window.nextDeleteStep = function() {
    const confirmDelete = document.getElementById('confirmDelete');
    const deletePassword = document.getElementById('deletePassword');
    const finalConfirm = document.getElementById('finalConfirm');
    
    switch(deleteStep) {
        case 1:
            if (!confirmDelete.checked) {
                showMessage('error', 'Please confirm that you understand the consequences');
                return;
            }
            document.getElementById('deleteStep1').style.display = 'none';
            document.getElementById('deleteStep2').style.display = 'block';
            deleteStep = 2;
            break;
        case 2:
            if (!deletePassword.value.trim()) {
                showMessage('error', 'Please enter your password');
                return;
            }
            document.getElementById('deleteStep2').style.display = 'none';
            document.getElementById('deleteStep3').style.display = 'block';
            document.getElementById('deleteNextBtn').style.display = 'none';
            document.getElementById('deleteConfirmBtn').style.display = 'block';
            deleteStep = 3;
            break;
    }
};

// Delete account
window.deleteAccount = async function() {
    const finalConfirm = document.getElementById('finalConfirm');
    
    if (finalConfirm.value !== 'DELETE') {
        showMessage('error', 'Please type DELETE to confirm');
        return;
    }
    
    try {
        const password = document.getElementById('deletePassword').value;
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        
        await reauthenticateWithCredential(currentUser, credential);
        
        // Delete all user data
        const userId = currentUser.uid;
        
        // Delete transactions
        const transactionsRef = collection(db, "users", userId, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        const deletePromises = [];
        
        transactionsSnapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        // Delete user document
        deletePromises.push(deleteDoc(doc(db, "users", userId)));
        
        await Promise.all(deletePromises);
        
        // Delete user account
        await deleteUser(currentUser);
        
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        showMessage('error', 'Failed to delete account. Please check your password and try again.');
    }
};

// Export functions for global use
window.saveProfile = saveProfile;
window.saveCategories = window.saveCategories;
window.addCustomCategory = window.addCustomCategory;
window.removeCustomCategory = window.removeCustomCategory;
window.nextDeleteStep = window.nextDeleteStep;
window.deleteAccount = window.deleteAccount;
