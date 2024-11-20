/**
 *  ChatGPT was used in forget_password.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script manages the password reset request process, including validating
 * email input, sending the request to the backend API, and displaying appropriate feedback messages.
 */
document.addEventListener("DOMContentLoaded", function () {
    const emailInput = document.getElementById("emailInput");
    const sendButton = document.querySelector('button.btn-primary');
    const messageDiv = document.getElementById("messageDiv");

    // Validate email format
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    sendButton.addEventListener("click", async (event) => {
        event.preventDefault(); // Prevent form submission
        const email = emailInput.value.trim();

        // Clear any previous message
        messageDiv.textContent = "";
        messageDiv.className = ""; // Reset message styles

        // Frontend validation
        if (!email) {
            showMessage(userMessages.emailEmpty, "danger");
            return; // Stop execution if email is empty
        }

        if (!isValidEmail(email)) {
            showMessage(userMessages.emailInvalid, "danger");
            return; // Stop execution if email is invalid
        }

        // Proceed with API request if email is valid
        try {
            const response = await fetch(serverEndpoints.requestPasswordReset, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, "success");
                // Redirect to reset password page after a short delay
                setTimeout(() => {
                    window.location.href = "reset_password.html";
                }, 2000);
            } else {
                showMessage(result.message, "danger");
            }
        } catch (error) {
            showMessage(userMessages.resetLinkError, "danger");
        }
    });

    // Function to show a message
    function showMessage(message, type) {
        messageDiv.className = `alert alert-${type} mt-2`; // Set message style based on type
        messageDiv.textContent = message;
    }
});
