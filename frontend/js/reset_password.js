document.addEventListener("DOMContentLoaded", function () {
  const RESET_PASSWORD_URL = "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/resetPassword"; // URL constant

  const form = document.getElementById("resetPasswordForm");
  const emailInput = form.querySelector('input[name="email"]');
  const resetCodeInput = form.querySelector('input[name="reset_code"]');
  const newPasswordInput = form.querySelector('input[name="new_password"]');
  const confirmPasswordInput = form.querySelector('input[name="confirm_password"]');

  // Try to get the email from the URL as a fallback
  const emailFromUrl = new URLSearchParams(window.location.search).get("email");
  if (emailFromUrl) {
    emailInput.value = emailFromUrl; // Prefill email if it’s in the URL
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    let isValid = true;
    clearValidation(form);

    const email = emailInput.value.trim();
    const resetCode = resetCodeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation checks
    if (!email) {
      showValidationError(emailInput, "Please enter your email address.");
      isValid = false;
    }
    if (!resetCode) {
      showValidationError(resetCodeInput, "Please enter the reset code.");
      isValid = false;
    }
    if (newPassword.length < 3) {
      showValidationError(newPasswordInput, "Password must be at least 3 characters long.");
      isValid = false;
    }
    if (newPassword !== confirmPassword) {
      showValidationError(confirmPasswordInput, "Passwords do not match.");
      isValid = false;
    }

    if (isValid) {
      try {
        // Send request to the backend
        const response = await fetch(RESET_PASSWORD_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            resetCode: resetCode,
            newPassword: newPassword,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          showSuccessMessage(form, "Your password has been reset successfully!");
          setTimeout(() => {
            form.reset();
            clearValidation(form);
            window.location.href = "authentication.html"; // Redirect to login page
          }, 2000);
        } else {
          showValidationError(resetCodeInput, result.message);
        }
      } catch (error) {
        showValidationError(resetCodeInput, "An error occurred. Please try again.");
      }
    }
  });
});

// Helper function to show validation error
function showValidationError(inputElement, message) {
  inputElement.classList.add("is-invalid");
  const feedbackElement = inputElement.nextElementSibling;
  if (feedbackElement && feedbackElement.classList.contains("invalid-feedback")) {
    feedbackElement.textContent = message;
  }
}

// Helper function to clear validation errors
function clearValidation(form) {
  const invalidInputs = form.querySelectorAll(".is-invalid");
  invalidInputs.forEach(function (input) {
    input.classList.remove("is-invalid");
  });

  // Remove any success messages
  const successMessage = form.querySelector(".form-success");
  if (successMessage) {
    successMessage.remove();
  }
}

// Helper function to show success message
function showSuccessMessage(form, message) {
  const successDiv = document.createElement("div");
  successDiv.className = "alert alert-success form-success";
  successDiv.textContent = message;
  form.insertBefore(successDiv, form.firstChild);
}
