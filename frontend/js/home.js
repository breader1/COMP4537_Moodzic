/**
 * ChatGPT was used in home.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script retrieves and displays the user's API call usage information,
 * indicating how many free calls have been made out of the total allowed.
 * It also displays any additional messages returned by the server.
 */

const MAX_FREE_CALLS = 20;

document.addEventListener("DOMContentLoaded", async function () {
  const apiCallsInfoElement = document.getElementById("apiCallsInfo");

  try {
    // Make the request to get the number of API calls
    const response = await fetch(serverEndpoints.getEndpointsCalledByUser, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check response status before parsing JSON
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || userMessages.apiCallsError);
    }

    const data = await response.json();

    // Extract the data array
    const userData = data.data?.[0]; // Assumes the first item corresponds to the logged-in user
    const userEndpoints = userData?.Endpoints || [];

    // Find data for the `generate-audio` endpoint
    const generateAudioData = userEndpoints.find(
      (endpoint) => endpoint.endpoint_name === "/generate-audio"
    );

    if (generateAudioData) {
      const numberOfRequests = generateAudioData.NumberOfRequests;

      // Replace {number} in the constant string and set the innerHTML
      const message = userMessages.apiCallsInfo.replace("{number}", numberOfRequests);

      apiCallsInfoElement.innerHTML = message;

      if (numberOfRequests >= MAX_FREE_CALLS) {
        apiCallsInfoElement.style.color = "red";
        const additionalMessage = document.createElement("p");
        additionalMessage.textContent = userMessages.apiCallsExceeded;
        additionalMessage.style.color = "red";
        apiCallsInfoElement.appendChild(additionalMessage);
      } else {
        apiCallsInfoElement.style.color = "";
      }
    } else {
      apiCallsInfoElement.innerHTML = userMessages.apiCallsNone;
    }
  } catch (error) {
    apiCallsInfoElement.innerHTML = `<p class="text-danger">${userMessages.apiCallsError}</p>`;
  }
});
