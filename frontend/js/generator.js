/**
 * ChatGPT was used in generator.js to help ask questions, generate code, and check for logic errors.
 *
 * @fileoverview This script handles the audio generation process based on user prompts,
 * displays an audio player for playback, and provides a download link. It also increments
 * the user's request count after successful generation.
 *
 **/

document.addEventListener("DOMContentLoaded", function () {
  const promptForm = document.getElementById("promptForm");
  const promptInput = document.getElementById("promptInput");
  const musicDisplay = document.getElementById("musicDisplay");
  const submitButton = document.querySelector("#submitButton");

  promptForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const promptText = promptInput.value.trim();

    if (!promptText) {
      musicDisplay.innerHTML = `<p class="text-danger" style="text-align: center;">${userMessages.promptEmpty}</p>`;
      return;
    }

    submitButton.disabled = true;

    let dotCount = 0;
    musicDisplay.innerHTML = `<p style="text-align: center;">${userMessages.generatingAudio}</p>`;

    const typingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      musicDisplay.innerHTML = `<p style="text-align: center;">${
        userMessages.generatingAudio
      }${".".repeat(dotCount)}</p>`;
    }, 500);

    try {
      const response = await fetch(serverEndpoints.llm, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptText: promptText,
          filename: "generated_audio",
        }),
      });

      if (!response.ok) {
        throw new Error(userMessages.audioGenerationError);
      }

      clearInterval(typingInterval);

      // Convert the response to a Blob (for audio)
      const audioBlob = await response.blob();

      // Create an audio URL from the Blob
      const audioUrl = URL.createObjectURL(audioBlob);

      musicDisplay.innerHTML = `
                <p class="text-center fw-bold mt-3">Your Prompt: "${promptText}"</p>
                <audio controls class="w-100 mt-3">
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                <a href="${audioUrl}" download="generated_audio.wav" class="btn btn-primary w-100 mt-2">Download Audio</a>
            `;

    } catch (error) {
      clearInterval(typingInterval);
      musicDisplay.innerHTML = `<p class="text-danger">${userMessages.audioGenerationError}</p>`;
    } finally {
      submitButton.disabled = false;
    }

    promptForm.reset();
  });
});
