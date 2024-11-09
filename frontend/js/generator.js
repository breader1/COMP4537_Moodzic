/**
 * ChatGPT was used in generator.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script handles the audio generation process based on user prompts,
 * displays an audio player for playback, and provides a download link. It also increments
 * the user's request count after successful generation.
 * 
 **/

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");

  // Redirect to index if not logged in
  if (!token) {
    window.location.href = "index.html";
  }

  const promptForm = document.getElementById("promptForm");
  const promptInput = document.getElementById("promptInput");
  const musicDisplay = document.getElementById("musicDisplay");

  promptForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const promptText = promptInput.value.trim();

    if (!promptText) {
      musicDisplay.innerHTML = `<p class="text-danger" style="text-align: center;">${userMessages.promptEmpty}</p>`;
      return;
    }

    // Clear previous audio display and set up "Generating audio..." animation
    let dotCount = 0;
    musicDisplay.innerHTML = `<p style="text-align: center;">${userMessages.generatingAudio}</p>`;

    // Create a typing effect for the dots
    const typingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4; // Cycle between 0, 1, 2, and 3 dots
      musicDisplay.innerHTML = `<p style="text-align: center;">${userMessages.generatingAudio}${".".repeat(dotCount)}</p>`;
    }, 500);

    try {
      // Send the prompt to the server
      const response = await fetch(llmEndpoint.llm, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          filename: "generated_audio",
        }),
      });

      if (!response.ok) {
        throw new Error(userMessages.audioGenerationError);
      }

      // Stop the typing animation once audio is ready
      clearInterval(typingInterval);

      // Convert the response to a Blob (for audio)
      const audioBlob = await response.blob();

      // Create an audio URL from the Blob
      const audioUrl = URL.createObjectURL(audioBlob);

      // Display the audio player
      musicDisplay.innerHTML = `
                <p class="text-center fw-bold mt-3">Your Prompt: "${promptText}"</p>
                <audio controls class="w-100 mt-3">
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                <a href="${audioUrl}" download="generated_audio.wav" class="btn btn-primary w-100 mt-2">Download Audio</a>
            `;

      // Call to increment the user's request count
      await incrementUserRequests();
    } catch (error) {
      clearInterval(typingInterval);
      musicDisplay.innerHTML = `<p class="text-danger">${userMessages.audioGenerationError}</p>`;
    }

    // Optionally reset the form
    promptForm.reset();
  });

  
  // Function to increment the user's number_of_requests
  async function incrementUserRequests() {
    const token = sessionStorage.getItem("token");
    const errorMessageElement = document.getElementById("errorMessage");

    if (!token) {
      errorMessageElement.textContent = userMessages.incrementRequestCountAuthError;
      return;
    }

    try {
      const response = await fetch(serverEndpoints.incrementUserRequests, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || userMessages.incrementRequestCountError);
      }

      // Clear any previous error message if the request is successful
      errorMessageElement.textContent = "";
    } catch (error) {
      errorMessageElement.textContent = userMessages.incrementRequestCountError;
    }
  }
});
