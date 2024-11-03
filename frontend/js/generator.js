// // home.js

// document.addEventListener('DOMContentLoaded', function () {
//     const promptForm = document.getElementById('promptForm');
//     const promptInput = document.getElementById('promptInput');

//     promptForm.addEventListener('submit', function (event) {
//         event.preventDefault(); // Prevent the default form submission

//         const promptText = promptInput.value.trim();

//         if (!promptText) {
//             // Display an error message or handle empty input
//             alert('Please enter a prompt.');
//             return;
//         }

//         // Process the prompt
//         // For example, send it to a server or display a message

//         // Placeholder for processing
//         alert('Your prompt has been submitted:\n' + promptText);

//         // Optionally reset the form
//         promptForm.reset();
//     });
// });

document.addEventListener('DOMContentLoaded', function () {
    const promptForm = document.getElementById('promptForm');
    const promptInput = document.getElementById('promptInput');
    const musicDisplay = document.getElementById('musicDisplay');

    promptForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission

        const promptText = promptInput.value.trim();

        if (!promptText) {
            alert('Please enter a prompt.');
            return;
        }

        // Clear previous audio display
        musicDisplay.innerHTML = "Generating audio...";

        try {
            // Send the prompt to the server
            const response = await fetch(llmEndpoint.llm, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    prompt: promptText, 
                    filename: "generated_audio"
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate audio");
            }

            // Convert the response to a Blob (for audio)
            const audioBlob = await response.blob();

            // Create an audio URL from the Blob
            const audioUrl = URL.createObjectURL(audioBlob);

            // Display the audio player
            musicDisplay.innerHTML = `
                <audio controls class="w-100 mt-3">
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                <a href="${audioUrl}" download="generated_audio.wav" class="btn btn-success w-100 mt-2">Download Audio</a>
            `;
        } catch (error) {
            console.error("Error generating audio:", error);
            musicDisplay.innerHTML = `<p class="text-danger">Failed to generate audio. Please try again.</p>`;
        }

        // Optionally reset the form
        promptForm.reset();
    });
});
