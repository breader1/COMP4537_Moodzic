/**
 * ChatGPT was used in home.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script retrieves and displays the user's API call usage information,
 * indicating how many free calls have been made out of the total allowed.
 * It also displays any additional messages returned by the server.
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Retrieve token from sessionStorage
  const token = sessionStorage.getItem("token");

  // Redirect to index if not logged in
  if (!token) {
    window.location.href = "index.html";
  }

  const apiCallsInfo = document.getElementById("apiCallsInfo");

  try {
    // Make the request to get the number of API calls
    const response = await fetch(serverEndpoints.getEndpointsCalledByUser, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

    let message;    
    if (generateAudioData) {
      // Use the NumberOfRequests for the specific endpoint
      message = userMessages.apiCallsInfo.replace("{number}", generateAudioData.NumberOfRequests);
    } else {
      // No data for the endpoint
      message = userMessages.apiCallsNone;
    }

    // Display additional message if available
    if (data.message) {
      message += `<br><span class="text-danger">${data.message}</span>`;
    }

    apiCallsInfo.innerHTML = message;
  } catch (error) {
    console.error("Error fetching user request data:", error);
    apiCallsInfo.innerHTML = `<p class="text-danger">${userMessages.apiCallsError}</p>`;
  }
});
