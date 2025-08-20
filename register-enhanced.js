// Enhanced Registration Form JavaScript

let currentStep = 1;
const totalSteps = 4;
const formData = new FormData();

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupPasswordStrength();
});

function initializeForm() {
    // Set minimum date for date of birth (18 years ago)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    document.getElementById('dateOfBirth').max = maxDate.toISOString().split('T')[0];
    
    // Initialize form validation
    validateCurrentStep();
}

function setupEventListeners() {
    // Real-time validation
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Form submission
    document.getElementById('registrationForm').addEventListener('submit', handleSubmit);

    // Enter key handling
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.type !== 'submit') {
            e.preventDefault();
            if (currentStep < totalSteps) {
                nextStep();
            }
        }
    });
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthIndicator(strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return score;
}

function updatePasswordStrengthIndicator(strength) {
    const indicator = document.getElementById('passwordStrength');
    let strengthText = '';
    let strengthClass = '';
    
    if (strength <= 2) {
        strengthText = 'Weak';
        strengthClass = 'weak';
    } else if (strength <= 4) {
        strengthText = 'Medium';
        strengthClass = 'medium';
    } else {
        strengthText = 'Strong';
        strengthClass = 'strong';
    }
    
    indicator.textContent = `Password strength: ${strengthText}`;
    indicator.className = `password-strength ${strengthClass}`;
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
            currentStep++;
            document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
            updateProgress();
            
            if (currentStep === 4) {
                populateReviewSection();
            }
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
        currentStep--;
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
        updateProgress();
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    
    // Update step indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function validateCurrentStep() {
    const currentStepElement = document.querySelector(`[data-step="${currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(input) {
    if (!input) {
        input = event.target;
    }
    
    const value = input.value.trim();
    const fieldName = input.name;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error
    clearFieldError(input);
    
    // Required field validation
    if (input.hasAttribute('required') && !value) {
        errorMessage = `${input.previousElementSibling.textContent.replace('*', '').trim()} is required`;
        isValid = false;
    }
    
    // Email validation
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorMessage = 'Please enter a valid email address';
            isValid = false;
        }
    }
    
    // Phone validation
    if (fieldName === 'phone' && value) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            errorMessage = 'Please enter a valid phone number';
            isValid = false;
        }
    }
    
    // Password validation
    if (fieldName === 'password' && value) {
        if (value.length < 8) {
            errorMessage = 'Password must be at least 8 characters long';
            isValid = false;
        }
    }
    
    // Password confirmation
    if (fieldName === 'confirmPassword' && value) {
        const password = document.getElementById('password').value;
        if (value !== password) {
            errorMessage = 'Passwords do not match';
            isValid = false;
        }
    }
    
    // Username validation
    if (fieldName === 'username' && value) {
        if (value.length < 3) {
            errorMessage = 'Username must be at least 3 characters long';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            errorMessage = 'Username can only contain letters, numbers, and underscores';
            isValid = false;
        }
    }
    
    // Date of birth validation
    if (fieldName === 'dateOfBirth' && value) {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (age < 18 || (age === 18 && monthDiff < 0)) {
            errorMessage = 'You must be at least 18 years old';
            isValid = false;
        }
    }
    
    if (!isValid) {
        showFieldError(input, errorMessage);
    }
    
    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = message;
    }
}

function clearFieldError(input) {
    if (!input) {
        input = event.target;
    }
    input.classList.remove('is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = '';
    }
}

function populateReviewSection() {
    // Personal Information
    const personalInfo = `
        <div class="review-item">
            <strong>Name:</strong> ${document.getElementById('firstName').value} ${document.getElementById('lastName').value}
        </div>
        <div class="review-item">
            <strong>Email:</strong> ${document.getElementById('email').value}
        </div>
        <div class="review-item">
            <strong>Phone:</strong> ${document.getElementById('phone').value || 'Not provided'}
        </div>
        <div class="review-item">
            <strong>Date of Birth:</strong> ${document.getElementById('dateOfBirth').value}
        </div>
    `;
    document.getElementById('reviewPersonalInfo').innerHTML = personalInfo;
    
    // Account Details
    const accountDetails = `
        <div class="review-item">
            <strong>Username:</strong> ${document.getElementById('username').value}
        </div>
        <div class="review-item">
            <strong>Security Question:</strong> ${document.getElementById('securityQuestion').selectedOptions[0].text}
        </div>
    `;
    document.getElementById('reviewAccountDetails').innerHTML = accountDetails;
    
    // Preferences
    const currency = document.getElementById('currency').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const budgetAlerts = document.getElementById('budgetAlerts').checked;
    const monthlyReports = document.getElementById('monthlyReports').checked;
    
    const preferences = `
        <div class="review-item">
            <strong>Currency:</strong> ${currency}
        </div>
        <div class="review-item">
            <strong>Notifications:</strong>
            <ul>
                ${emailNotifications ? '<li>Email notifications</li>' : ''}
                ${budgetAlerts ? '<li>Budget alerts</li>' : ''}
                ${monthlyReports ? '<li>Monthly reports</li>' : ''}
            </ul>
        </div>
    `;
    document.getElementById('reviewPreferences').innerHTML = preferences;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    if (!document.getElementById('terms').checked) {
        alert('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    // Show loading
    showLoading();
    
    // Collect all form data
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    
    // Convert FormData to object
    const data = {};
    formData.forEach((value, key) => {
        if (key === 'incomeCategories' || key === 'expenseCategories') {
            if (!data[key]) data[key] = [];
            data[key].push(value);
        } else {
            data[key] = value;
        }
    });
    
    try {
        // Simulate API call
        await simulateRegistration(data);
        
        // Success
        showSuccessMessage();
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
        
    } catch (error) {
        showErrorMessage(error.message);
    } finally {
        hideLoading();
    }
}

function simulateRegistration(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate 90% success rate
            if (Math.random() > 0.1) {
                resolve(data);
            } else {
                reject(new Error('Registration failed. Please try again.'));
            }
        }, 2000);
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-check"></i> Create Account';
}

function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>Success!</strong> Your account has been created. Redirecting to dashboard...
    `;
    document.querySelector('.registration-card').appendChild(successDiv);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Error:</strong> ${message}
    `;
    document.querySelector('.registration-card').appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility functions
function formatPhoneNumber(input) {
    const value = input.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    input.value = formatted;
}

// Add phone formatting
document.getElementById('phone').addEventListener('input', function(e) {
    formatPhoneNumber(this);
});
