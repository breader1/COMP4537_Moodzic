/**
 * ChatGPT was used in reset_password.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script manages the password reset form, including validating user input,
 * sending the reset request to the backend API, and displaying success or error messages.
 * 
 */

document.addEventListener("DOMContentLoaded", async function () { 
  
  await fetch(serverEndpoints.verify, {
    method: httpMethod.get,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (response) => {
    if (response.status === statusCode.httpOk) {
      window.location.href = redirectLink.home;
    }
  });

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
      showValidationError(emailInput, userMessages.emailEmpty);
      isValid = false;
    }
    if (!resetCode) {
      showValidationError(resetCodeInput, userMessages.resetCodeEmpty);
      isValid = false;
    }
    if (newPassword.length < 3) {
      showValidationError(newPasswordInput, userMessages.passwordTooShort);
      isValid = false;
    }
    if (newPassword !== confirmPassword) {
      showValidationError(confirmPasswordInput, userMessages.passwordMismatch);
      isValid = false;
    }

    if (isValid) {
      try {
        // Send request to the backend
        const response = await fetch(serverEndpoints.resetPassword, {
          method: httpMethod.post,
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
          showSuccessMessage(form, userMessages.passwordResetSuccess);
          setTimeout(() => {
            form.reset();
            clearValidation(form);
            window.location.href = redirectLink.auth; // Redirect to login page
          }, delayTimes.twoSeconds);
        } else {
          showValidationError(resetCodeInput, result.message);
        }
      } catch (error) {
        showValidationError(resetCodeInput, userMessages.generalError);
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
