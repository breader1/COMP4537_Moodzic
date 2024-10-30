// home.js

document.addEventListener('DOMContentLoaded', function () {
    const promptForm = document.getElementById('promptForm');
    const promptInput = document.getElementById('promptInput');

    promptForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        const promptText = promptInput.value.trim();

        if (!promptText) {
            // Display an error message or handle empty input
            alert('Please enter a prompt.');
            return;
        }

        // Process the prompt
        // For example, send it to a server or display a message

        // Placeholder for processing
        alert('Your prompt has been submitted:\n' + promptText);

        // Optionally reset the form
        promptForm.reset();
    });
});
