// admin.js
document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = serverEndpoints.getAllUsersData; // Replace with the actual endpoint URL
  
    // Fetch data from the API
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => displayUserData(data))
      .catch(error => console.error("Error fetching user data:", error));
  });
  
  // Function to display user data on the admin page
  function displayUserData(data) {
    // Get the container where the data will be displayed
    const container = document.querySelector(".container");
  
    // Create the title and description
    const title = document.createElement("h1");
    title.classList.add("mb-3");
    title.textContent = "Administration Page";
  
    const description = document.createElement("p");
    description.textContent = "Keep track of the number of free calls made by users";
  
    // Create a table to display the user data
    const table = document.createElement("table");
    table.classList.add("table", "table-bordered", "mt-4");
  
    // Create table headers
    const headers = `<thead class="table-dark">
                       <tr>
                         <th>Email</th>
                         <th>API Request Count</th>
                       </tr>
                     </thead>`;
    table.innerHTML = headers;
  
    // Create table body with data
    const tbody = document.createElement("tbody");
    data.forEach(user => {
      const row = `<tr>
                     <td>${user.email}</td>
                     <td>${user.apiRequestCount}</td>
                   </tr>`;
      tbody.innerHTML += row;
    });
  
    table.appendChild(tbody);
  
    // Append title, description, and table to the container
    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(table);
  }
  