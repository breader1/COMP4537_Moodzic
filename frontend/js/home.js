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
    const response = await fetch(serverEndpoints.getUserNumberOfRequests, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || userMessages.apiCallsError
      );
    }

    // Display the number of requests
    let message = userMessages.apiCallsInfo.replace("{number}", data.number_of_requests);

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
