document.addEventListener("DOMContentLoaded", async function () {
  const apiCallsInfo = document.getElementById("apiCallsInfo");

  // Retrieve token from sessionStorage
  const token = sessionStorage.getItem("token");
  const email = sessionStorage.getItem("email");

  if (!token || !email) {
    apiCallsInfo.innerHTML = `<p class="text-danger">User not logged in. Please log in first.</p>`;
    return;
  }

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
