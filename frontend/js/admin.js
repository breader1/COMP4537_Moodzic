// admin.js
document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = serverEndpoints.getAllUsersData; // Replace with the actual endpoint URL
    const token = localStorage.getItem("token");
  
    // Fetch data from the API
    fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          // Check if response is an error
          if (data.message) {
            throw new Error(data.message); // Handle unauthorized error
          }
          displayUserData(data);
        })
        .catch(error => console.error("Error fetching user data:", error));
    });
  
  // Function to display user data on the admin page
  function displayUserData(data) {
    if (!Array.isArray(data)) {
      console.error("Data is not an array:", data);
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
    data.forEach(user => {
      const row = `<tr>
                     <td>${user.email}</td>
                     <td>${user.number_of_requests}</td>
                   </tr>`;
      tbody.innerHTML += row;
    });
  
    table.appendChild(tbody);
    container.appendChild(table);
  }