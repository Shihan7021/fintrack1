// Enhanced Registration Form JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
let currentStep = 1;
const totalSteps = 3;
let formData = {
    account: {},
    personal: {},
    categories: {
        income: [],
        expense: []
    }
};

// Predefined categories
const predefinedCategories = {
    income: [
        'Salary', 'Freelance', 'Business', 'Investment', 'Rental', 
        'Bonus', 'Gift', 'Refund', 'Other Income'
    ],
    expense: [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
        'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 
        'Insurance', 'Savings', 'Debt Payment', 'Other Expense'
    ]
};

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    loadCategories();
});

// Form initialization
function initializeForm() {
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('.register-section');
    sections.forEach(section => {
        section.classList.add('fade-in');
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Event listeners
function setupEventListeners() {
    // Password visibility toggles
    document.getElementById('togglePassword').addEventListener('click', () => togglePasswordVisibility('newPassword'));
    document.getElementById('toggleConfirmPassword').addEventListener('click', () => togglePasswordVisibility('confirmPassword'));
    
    // Password strength checker
    document.getElementById('newPassword').addEventListener('input', checkPasswordStrength);
    
    // Email confirmation
    document.getElementById('confirmEmail').addEventListener('input', validateEmailMatch);
    document.getElementById('userEmail').addEventListener('input', validateEmailMatch);
    
    // Form validation
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleSubmit);
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Navigation functions
function nextStep(step) {
    if (validateStep(step)) {
        document.getElementById(`step${step}`).style.display = 'none';
        currentStep = step + 1;
        document.getElementById(`step${currentStep}`).style.display = 'block';
        updateProgressBar();
        saveStepData(step);
        scrollToTop();
    }
}

function previousStep(step) {
    document.getElementById(`step${step}`).style.display = 'none';
    currentStep = step - 1;
    document.getElementById(`step${currentStep}`).style.display = 'block';
    updateProgressBar();
    scrollToTop();
}

function updateProgressBar() {
    const progressPercent = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validation functions
function validateStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    const inputs = stepElement.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(event) {
    const field = event.target;
    if (!field.checkValidity()) {
        field.classList.add('is-invalid');
    } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }
}

function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('is-invalid');
    field.classList.remove('is-valid');
}

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    }
}

// Password strength checker
function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    let strengthClass = '';
    let strengthMessage = '';
    
    switch (strength) {
        case 0:
        case 1:
            strengthClass = 'weak';
            strengthMessage = 'Weak';
            break;
        case 2:
        case 3:
            strengthClass = 'medium';
            strengthMessage = 'Medium';
            break;
        case 4:
        case 5:
            strengthClass = 'strong';
            strengthMessage = 'Strong';
            break;
    }
    
    strengthBar.className = `strength-bar-fill ${strengthClass}`;
    strengthText.textContent = strengthMessage;
}

// Email validation
function validateEmailMatch() {
    const email = document.getElementById('userEmail').value;
    const confirmEmail = document.getElementById('confirmEmail').value;
    const confirmEmailField = document.getElementById('confirmEmail');
    
    if (confirmEmail && email !== confirmEmail) {
        confirmEmailField.setCustomValidity('Email addresses do not match');
        confirmEmailField.classList.add('is-invalid');
    } else {
        confirmEmailField.setCustomValidity('');
        confirmEmailField.classList.remove('is-invalid');
    }
}

// Category management
function loadCategories() {
    const incomeContainer = document.getElementById('incomeCategories');
    const expenseContainer = document.getElementById('expenseCategories');
    
    // Load income categories
    predefinedCategories.income.forEach(category => {
        const categoryDiv = createCategoryElement(category, 'income');
        incomeContainer.appendChild(categoryDiv);
    });
    
    // Load expense categories
    predefinedCategories.expense.forEach(category => {
        const categoryDiv = createCategoryElement(category, 'expense');
        expenseContainer.appendChild(categoryDiv);
    });
}

function createCategoryElement(categoryName, type) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.innerHTML = `
        <input type="checkbox" id="${type}_${categoryName}" name="${type}Categories" value="${categoryName}">
        <label for="${type}_${categoryName}">${categoryName}</label>
    `;
    return div;
}

// Data saving functions
function saveStepData(step) {
    switch (step) {
        case 1:
            formData.account = {
                email: document.getElementById('userEmail').value,
                password: document.getElementById('newPassword').value,
                username: document.getElementById('username').value
            };
            break;
        case 2:
            formData.personal = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value,
                country: document.getElementById('country').value,
                currency: document.getElementById('currency').value
            };
            break;
        case 3:
            formData.categories = {
                income: getSelectedCategories('income'),
                expense: getSelectedCategories('expense')
            };
            break;
    }
}

function getSelectedCategories(type) {
    const checkboxes = document.querySelectorAll(`input[name="${type}Categories"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateStep(3)) {
        return;
    }
    
    saveStepData(3);
    
    try {
        showLoading(true);
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.account.email,
            formData.account.password
        );
        
        const user = userCredential.user;
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            account: formData.account,
            personal: formData.personal,
            categories: formData.categories,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Show success message
        showSuccessMessage();
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage(error.message);
    } finally {
        showLoading(false);
    }
}

// UI helper functions
function showLoading(show) {
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = submitBtn.querySelector('.spinner-border');
    
    if (show) {
        submitBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Account...';
    } else {
        submitBtn.disabled = false;
        loadingSpinner.style.display = 'none';
        submitBtn.innerHTML = 'Complete Registration';
    }
}

function showSuccessMessage() {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <strong>Success!</strong> Your account has been created successfully. Redirecting to dashboard...
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.register-header').after(alertDiv);
}

function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <strong>Error!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.register-header').after(alertDiv);
}

// Utility functions
function formatPhoneNumber(value) {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
        return phoneNumber;
    } else if (phoneNumber.length <= 6) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
}

// Initialize phone number formatting
document.getElementById('phone').addEventListener('input', function(e) {
    e.target.value = formatPhoneNumber(e.target.value);
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateStep,
        checkPasswordStrength,
        validateEmailMatch,
        formatPhoneNumber
    };
}

// Enhanced registration handler
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('newPassword').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save additional user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            profession: document.getElementById('profession').value,
            ageRange: document.getElementById('ageRange').value,
            country: document.getElementById('country').value,
            incomeRange: document.getElementById('incomeRange').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            cycleDate: document.getElementById('cycleDate').value,
            // Add other fields as needed
        });

        alert('Registration successful!');
        // Redirect to dashboard or login page
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed: ' + error.message);
    }
});
