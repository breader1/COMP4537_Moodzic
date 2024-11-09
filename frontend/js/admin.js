/**
 * ChatGPT was used in admin.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This code checks if a user is logged in by verifying a session token and, if authenticated,
 * fetches and displays user data in a table on the admin page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");

  // Redirect to index if not logged in
  if (!token) {
    window.location.href = "index.html";
  }

  const userRole = sessionStorage.getItem("role");

  // Redirect to home if the user is not an admin
  if (userRole !== "1") {
    alert(userMessages.notAuthorized); // Alert user of lack of authorization
    window.location.href = "home.html";
    return;
  }

  const apiUrl = serverEndpoints.getAllUsersData; 

  // Fetch data from the API
  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Check if response is an error
      if (data.message) {
        throw new Error(data.message);
      }
      displayUserData(data);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      alert(userMessages.userDataFetchError); // Display error message
    });
});

// Function to display user data on the admin page
function displayUserData(data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array:", data);
    alert(userMessages.userDataFetchError); // Show error if data is not an array
    return;
  }

  const container = document.querySelector(".container");

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered", "mt-4");

  const headers = `<thead class="table-dark">
                       <tr>
                         <th>Email</th>
                         <th>API Request Count</th>
                       </tr>
                     </thead>`;
  table.innerHTML = headers;

  const tbody = document.createElement("tbody");
  data.forEach((user) => {
    const row = `<tr>
                     <td>${user.email}</td>
                     <td>${user.number_of_requests}</td>
                   </tr>`;
    tbody.innerHTML += row;
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
