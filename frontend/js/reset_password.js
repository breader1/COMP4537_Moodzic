// reset_password.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resetPasswordForm");
  const resetCodeInput = form.querySelector('input[name="reset_code"]');
  const newPasswordInput = form.querySelector('input[name="new_password"]');
  const confirmPasswordInput = form.querySelector(
    'input[name="confirm_password"]'
  );

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    let isValid = true;

    // Clear previous error states
    clearValidation(form);

    const resetCode = resetCodeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate reset code
    if (!resetCode) {
      showValidationError(resetCodeInput, "Please enter the reset code.");
      isValid = false;
    }

    // Validate new password length
    if (newPassword.length < 3) {
      showValidationError(
        newPasswordInput,
        "Password must be at least 3 characters long."
      );
      isValid = false;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      showValidationError(confirmPasswordInput, "Passwords do not match.");
      isValid = false;
    }

    if (isValid) {

      // Process the reset password logic here (e.g., send data to server)
      // For demonstration, we'll show a success message
      document.addEventListener("DOMContentLoaded", function () {
        const form = document.getElementById("resetPasswordForm");
        const resetCodeInput = form.querySelector('input[name="reset_code"]');
        const newPasswordInput = form.querySelector('input[name="new_password"]');
        const confirmPasswordInput = form.querySelector('input[name="confirm_password"]');
        const email = new URLSearchParams(window.location.search).get("email"); // Extract email from URL, if needed
      
        form.addEventListener("submit", async function (event) {
          event.preventDefault(); // Prevent default form submission
      
          let isValid = true;
          clearValidation(form);
      
          const resetCode = resetCodeInput.value.trim();
          const newPassword = newPasswordInput.value;
          const confirmPassword = confirmPasswordInput.value;
      
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
              const response = await fetch("http://localhost:3000/resetPassword", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: email, // Include email in the request if required by backend
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

      // Reset the form after a short delay
      setTimeout(() => {
        form.reset();
        clearValidation(form);
        // Optionally redirect the user
        window.location.href = "authentication.html";
      }, 2000);
    }
  });
});

// Helper function to show validation error
function showValidationError(inputElement, message) {
  inputElement.classList.add("is-invalid");
  const feedbackElement = inputElement.nextElementSibling;
  if (
    feedbackElement &&
    feedbackElement.classList.contains("invalid-feedback")
  ) {
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
