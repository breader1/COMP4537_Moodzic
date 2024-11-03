 document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.querySelector('input[type="email"]');
  const sendButton = document.querySelector('button.btn-primary');
  const messageDiv = document.createElement("div");

  // Validate email format
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  sendButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    // Frontend validation
    if (!email) {
      messageDiv.className = "alert alert-danger";
      messageDiv.textContent = "Please enter your email address.";
      emailInput.insertAdjacentElement("afterend", messageDiv);
      return;
    }

    if (!isValidEmail(email)) {
      messageDiv.className = "alert alert-danger";
      messageDiv.textContent = "Please enter a valid email address.";
      emailInput.insertAdjacentElement("afterend", messageDiv);
      return;
    }

    // Proceed with API request if email is valid
    try {
      const response = await fetch("http://localhost:3000/requestPasswordReset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.className = "alert alert-success";
        messageDiv.textContent = result.message;
        emailInput.insertAdjacentElement("afterend", messageDiv);
        // Redirect to reset password page with email in the URL after a short delay
        setTimeout(() => {
          window.location.href = `reset_password.html?email=${encodeURIComponent(email)}`;
        }, 2000);
      } else {
        messageDiv.className = "alert alert-danger";
        messageDiv.textContent = result.message;
        emailInput.insertAdjacentElement("afterend", messageDiv);
      }
    } catch (error) {
      messageDiv.className = "alert alert-danger";
      messageDiv.textContent = "An error occurred while sending the reset link.";
      emailInput.insertAdjacentElement("afterend", messageDiv);
    }
  });
});