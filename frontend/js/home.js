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
        data.message || "Failed to retrieve API call information."
      );
    }

    // Display the number of requests
    let message = `You have made ${data.number_of_requests} out of 20 free API calls.`;

    // Display additional message if available
    if (data.message) {
      message += `<br><span class="text-danger">${data.message}</span>`;
    }

    apiCallsInfo.innerHTML = message;
  } catch (error) {
    console.error("Error fetching user request data:", error);
    apiCallsInfo.innerHTML = `<p class="text-danger">Failed to retrieve API call information. Please try again later.</p>`;
  }
});
