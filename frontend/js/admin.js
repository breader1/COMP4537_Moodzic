/**
 * ChatGPT was used in admin.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This code checks if a user is logged in by verifying a session token and, if authenticated,
 * fetches and displays user data in a table on the admin page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
  }

  const userRole = sessionStorage.getItem("role");

  if (userRole !== "1") {
    alert(userMessages.notAuthorized);
    window.location.href = "home.html";
    return;
  }

  const apiUrl = serverEndpoints.getAllUsersData;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        throw new Error(data.message);
      }
      displayUserData(data);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      alert(userMessages.userDataFetchError);
    });

  // Fetch the endpoints called by the user
  const endpointUrl = serverEndpoints.getNumberOfRequestsByEndpoint;

  fetch(endpointUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((responseData) => {
      // Access the 'data' field in the response object
      if (!Array.isArray(responseData.data)) {
        throw new Error("Response data is not an array.");
      }
      displayUserEndpoint(responseData.data);
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      alert(userMessages.userDataFetchError);
    });
});


// Display user data in a table
function displayUserData(data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array:", data);
    alert(userMessages.userDataFetchError);
    return;
  }

  const container = document.querySelector(".container");

  // Add title for the user data table
  const title = document.createElement("h3");
  title.textContent = "User Data";
  title.classList.add("table-title", "mt-4");
  container.appendChild(title);

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered", "mt-4");

  const headers = `<thead class="table-dark">
                     <tr>
                       <th>Email</th>
                       <th>Total Requests</th>
                       <th>Role</th>
                       <th>Actions</th>
                     </tr>
                   </thead>`;
  table.innerHTML = headers;

  const tbody = document.createElement("tbody");
  data.forEach((user) => {
    const row = document.createElement("tr");
    row.setAttribute("data-user-id", user.user_id); // Add data-user-id attribute

    row.innerHTML = `
      <td>${user.email}</td>
      <td>${user.number_of_requests}</td>
      <td>
        <select class="form-select" data-user-id="${user.user_id}">
          <option value="0" ${user.role_id === 2 ? "selected" : ""}>User</option>
          <option value="1" ${user.role_id === 1 ? "selected" : ""}>Admin</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary btn-update-role" data-user-id="${user.user_id}">Update Role</button>
        <button class="btn btn-danger btn-delete-user" data-user-id="${user.user_id}">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Add event listeners for role update buttons
  document.querySelectorAll(".btn-update-role").forEach((button) => {
    button.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id");
      const roleSelect = document.querySelector(`select[data-user-id="${userId}"]`);
      const newRole = roleSelect.value;
      updateUserRole(userId, newRole);
    });
  });

  // Add event listeners for delete buttons
  document.querySelectorAll(".btn-delete-user").forEach((button) => {
    button.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id");
      if (confirm("Are you sure you want to delete this user?")) {
        deleteUser(userId);
      }
    });
  });
}


// Delete user function
function deleteUser(userId) {
  const token = sessionStorage.getItem("token");

  fetch(`${serverEndpoints.deleteUser}/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.message) {
        alert(data.message);
      } else {
        alert("User deleted successfully.");
        // Remove the user row from the table
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (userRow) {
          userRow.remove();
        }
      }
    })
    .catch((error) => {
      console.error("Error deleting user:", error);
      alert("An error occurred while deleting the user.");
    });
}


// Update user role function
function updateUserRole(userId, newRole) {
  const token = sessionStorage.getItem("token");

  fetch(`${serverEndpoints.updateRole}/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role: newRole }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
      } else {
        alert("Role updated successfully.");
      }
    })
    .catch((error) => {
      console.error("Error updating user role:", error);
      alert("An error occurred while updating the role.");
    });
}

// Display user endpoint data in a table
function displayUserEndpoint(data) {
  console.log("Received data:", data); // Log the response data

  if (!Array.isArray(data)) {
    console.error("Data is not an array:", data);
    alert("Unexpected response format. Please try again later.");
    return;
  }

  const container = document.querySelector(".container");

  // Add title for the endpoints table
  const title = document.createElement("h3");
  title.textContent = "API Endpoint Total Requests";
  title.classList.add("table-title", "mt-4");
  container.appendChild(title);

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered", "mt-4");

  const headers = `<thead class="table-dark">
                       <tr>   
                         <th>Method</th>
                         <th>Endpoint</th>
                         <th>Request</th>
                       </tr>
                     </thead>`;
  table.innerHTML = headers;

  const tbody = document.createElement("tbody");
  data.forEach((endPoint) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${endPoint.Method}</td>
      <td>${endPoint.Endpoint}</td>
      <td>${endPoint.NumberOfRequests}</td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
