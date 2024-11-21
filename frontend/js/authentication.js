/**
 * ChatGPT was used in authentication.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script handles the display and toggling of login and registration forms,
 * validates form inputs, and manages user authentication by sending registration and login
 * requests to the backend. Success or error messages are displayed based on server responses.
 */

function showForm(formType) {
  const loginFormContainer = document.getElementById("login-form");
  const registerFormContainer = document.getElementById("register-form");

  if (formType === "login") {
    loginFormContainer.classList.remove("d-none");
    registerFormContainer.classList.add("d-none");
  } else if (formType === "register") {
    loginFormContainer.classList.add("d-none");
    registerFormContainer.classList.remove("d-none");
  }
}

// Default to show login form on page load
window.onload = () => showForm("login");

document.addEventListener("DOMContentLoaded", function () {
  // Registration Form Validation
  const registerForm = document.getElementById("registerForm");
  const registerEmailInput = registerForm.querySelector('input[name="email"]');
  const registerPasswordInput = registerForm.querySelector('input[name="password"]');
  const registerConfirmPasswordInput = registerForm.querySelector('input[name="confirm_password"]');

  registerForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    let isValid = true;
    clearValidation(registerForm);

    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;
    const confirmPassword = registerConfirmPasswordInput.value;

    // Email validation
    if (!email || !isValidEmail(email)) {
      showValidationError(registerEmailInput, userMessages.emailInvalid);
      isValid = false;
    }

    // Password length validation
    if (password.length < 3) {
      showValidationError(registerPasswordInput, userMessages.passwordTooShort);
      isValid = false;
    }

    // Password match validation
    if (password !== confirmPassword) {
      showValidationError(registerConfirmPasswordInput, userMessages.passwordMismatch);
      isValid = false;
    }

    if (isValid) {
      // Send registration data to backend
      fetch(serverEndpoints.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then((response) =>
          response.json().then((data) => ({ status: response.status, body: data }))
        )
        .then(({ status, body }) => {
          if (status === 201) {
            showSuccessMessage(registerForm, userMessages.registrationSuccess);
            setTimeout(() => {
              registerForm.reset();
              clearValidation(registerForm);
              // Switch back to login form
              showForm("login");
            }, 2000);
          } else {
            // Handle errors using the backend messages
            handleBackendErrors(registerForm, body);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showGeneralError(registerForm, userMessages.registrationError);
        });
    }
  });

  // Login Form Validation
  const loginForm = document.getElementById("loginForm");
  const loginEmailInput = loginForm.querySelector('input[name="email"]');
  const loginPasswordInput = loginForm.querySelector('input[name="password"]');

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form default submission

    let isValid = true;

    // Clear previous error states
    clearValidation(loginForm);

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    // Email validation
    if (!email || !isValidEmail(email)) {
      showValidationError(loginEmailInput, userMessages.emailInvalid);
      isValid = false;
    }

    // Password validation
    if (!password) {
      showValidationError(loginPasswordInput, userMessages.enterPassword);
      isValid = false;
    }

    if (isValid) {
      // Send login data to backend
      fetch(serverEndpoints.login, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then((response) =>
          response.json().then((data) => ({ status: response.status, body: data }))
        )
        .then(({ status, body }) => {
          if (status === 200) {
            // Login successful
            sessionStorage.setItem("role", body.role);

            // Wait briefly to allow the browser to process the cookie
            // setTimeout(() => {
            //   window.location.href = "home.html";
            // }, 3000);
          } else {
            // Login failed, display error message from backend
            if (body.message) {
              // Decide where to display the message based on status code
              if (status === 400 && body.message.includes("email")) {
                // Error related to email
                showValidationError(loginEmailInput, body.message);
              } else if (status === 401 && body.message.includes("password")) {
                // Error related to password
                showValidationError(loginPasswordInput, body.message);
              } else {
                // General error
                showGeneralError(loginForm, body.message);
              }
            } else {
              showGeneralError(loginForm, userMessages.loginFailed);
            }
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showGeneralError(loginForm, userMessages.loginError);
        });
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
  inputElement.classList.add("is-invalid");
  let feedbackElement = inputElement.nextElementSibling;
  if (!feedbackElement || !feedbackElement.classList.contains("invalid-feedback")) {
    feedbackElement = document.createElement("div");
    feedbackElement.className = "invalid-feedback";
    inputElement.parentNode.appendChild(feedbackElement);
  }
  feedbackElement.textContent = message;
}

function showGeneralError(form, message) {
  // Remove any existing general error messages
  const existingError = form.querySelector(".form-error");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-danger form-error";
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

// Helper function to clear validation errors
function clearValidation(form) {
  // Remove 'is-invalid' and 'is-valid' classes
  const inputs = form.querySelectorAll(".is-invalid, .is-valid");
  inputs.forEach((input) => {
    input.classList.remove("is-invalid", "is-valid");
  });

  // Remove validation messages
  const feedbacks = form.querySelectorAll(".invalid-feedback, .valid-feedback");
  feedbacks.forEach((feedback) => feedback.remove());

  // Remove any success messages
  const successMessage = form.querySelector(".form-success");
  if (successMessage) {
    successMessage.remove();
  }

  // Remove any general error messages
  const generalError = form.querySelector(".form-error");
  if (generalError) {
    generalError.remove();
  }
}

// Helper function to show success message
function showSuccessMessage(form, message) {
  const successDiv = document.createElement("div");
  successDiv.className = "alert alert-success form-success";
  successDiv.textContent = message;
  form.insertBefore(successDiv, form.firstChild);
}

// Helper function to handle backend errors
function handleBackendErrors(form, body) {
  if (body.errors) {
    for (const field in body.errors) {
      if (field === "general") {
        // Display general error message
        showGeneralError(form, body.errors[field]);
      } else {
        const inputElement = form.querySelector(`input[name="${field}"]`);
        if (inputElement) {
          showValidationError(inputElement, body.errors[field]);
        }
      }
    }
  } else if (body.message) {
    // Display general error message
    showGeneralError(form, body.message);
  } else {
    showGeneralError(form, "An error occurred. Please try again.");
  }
}
