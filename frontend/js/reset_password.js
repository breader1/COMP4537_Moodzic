// reset_password.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('resetPasswordForm');
    const resetCodeInput = form.querySelector('input[name="reset_code"]');
    const newPasswordInput = form.querySelector('input[name="new_password"]');
    const confirmPasswordInput = form.querySelector('input[name="confirm_password"]');

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        let isValid = true;

        // Clear previous error states
        clearValidation(form);

        const resetCode = resetCodeInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate reset code
        if (!resetCode) {
            showValidationError(resetCodeInput, 'Please enter the reset code.');
            isValid = false;
        }

        // Validate new password length
        if (newPassword.length < 6) {
            showValidationError(newPasswordInput, 'Password must be at least 6 characters long.');
            isValid = false;
        }

        // Validate password match
        if (newPassword !== confirmPassword) {
            showValidationError(confirmPasswordInput, 'Passwords do not match.');
            isValid = false;
        }

        if (isValid) {
            // Process the reset password logic here (e.g., send data to server)
            // For demonstration, we'll show a success message
            showSuccessMessage(form, 'Your password has been reset successfully!');

            // Reset the form after a short delay
            setTimeout(() => {
                form.reset();
                clearValidation(form);
                // Optionally redirect the user
                window.location.href = 'login.html';
            }, 2000);
        }
    });
});

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
