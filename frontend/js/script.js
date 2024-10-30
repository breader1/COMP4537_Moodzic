// script.js

function showForm(formType) {
    const loginFormContainer = document.getElementById('login-form');
    const registerFormContainer = document.getElementById('register-form');

    if (formType == 'login') {
        loginFormContainer.classList.remove('d-none');
        registerFormContainer.classList.add('d-none');
    } else if (formType == 'register') {
        loginFormContainer.classList.add('d-none');
        registerFormContainer.classList.remove('d-none');
    }
}

// Default to show login form on page load
window.onload = () => showForm('login');

document.addEventListener('DOMContentLoaded', function () {
    // Registration Form Validation
    const registerForm = document.getElementById('registerForm');
    const registerEmailInput = registerForm.querySelector('input[name="email"]');
    const registerPasswordInput = registerForm.querySelector('input[name="password"]');
    const registerConfirmPasswordInput = registerForm.querySelector('input[name="confirm_password"]');

    registerForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        let isValid = true;

        // Clear previous error states
        clearValidation(registerForm);

        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;

        // Email validation
        if (!email || !isValidEmail(email)) {
            showValidationError(registerEmailInput, 'Please enter a valid email address.');
            isValid = false;
        }

        // Password length validation
        if (password.length < 6) {
            showValidationError(registerPasswordInput, 'Password must be at least 6 characters long.');
            isValid = false;
        }

        // Password match validation
        if (password !== confirmPassword) {
            showValidationError(registerConfirmPasswordInput, 'Passwords do not match.');
            isValid = false;
        }

        if (isValid) {
            // Registration logic here (e.g., send data to server)
            // For demonstration, we'll show a success message on the page
            showSuccessMessage(registerForm, 'Registration successful! You can now log in.');

            // Reset the form after a short delay
            setTimeout(() => {
                registerForm.reset();
                clearValidation(registerForm);
                // Switch back to login form
                showForm('login');
            }, 2000);
        }
    });

    // Login Form Validation
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = loginForm.querySelector('input[name="email"]');
    const loginPasswordInput = loginForm.querySelector('input[name="password"]');

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        let isValid = true;

        // Clear previous error states
        clearValidation(loginForm);

        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        // Email validation
        if (!email || !isValidEmail(email)) {
            showValidationError(loginEmailInput, 'Please enter a valid email address.');
            isValid = false;
        }

        // Password validation
        if (!password) {
            showValidationError(loginPasswordInput, 'Please enter your password.');
            isValid = false;
        }

        if (isValid) {
            // Login logic here (e.g., send data to server)
            // For demonstration, we'll show a success message on the page
            showSuccessMessage(loginForm, 'Login successful! Redirecting...');
            // localStorage.setItem('isLoggedIn', 'true');

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
        }
    });
});

// Helper function to validate email format
function isValidEmail(email) {
    // Simple regex for demonstration purposes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to show validation error
function showValidationError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    const feedbackElement = inputElement.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = message;
    }
}

// Helper function to clear validation errors
function clearValidation(form) {
    const invalidInputs = form.querySelectorAll('.is-invalid');
    invalidInputs.forEach(function (input) {
        input.classList.remove('is-invalid');
    });

    // Remove any success messages
    const successMessage = form.querySelector('.form-success');
    if (successMessage) {
        successMessage.remove();
    }
}

// Helper function to show success message
function showSuccessMessage(form, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success form-success';
    successDiv.textContent = message;
    form.insertBefore(successDiv, form.firstChild);
}
