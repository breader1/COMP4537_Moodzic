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
});

function displayUserData(data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array:", data);
    alert(userMessages.userDataFetchError);
    return;
  }

  const container = document.querySelector(".container");

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered", "mt-4");

  const headers = `<thead class="table-dark">
                       <tr>
                       <th>ID</th>
                         <th>Email</th>
                         <th>API Request Count</th>
                         <th>Role</th>
                         <th>Actions</th>
                       </tr>
                     </thead>`;
  table.innerHTML = headers;

  const tbody = document.createElement("tbody");
  data.forEach((user) => {
    const row = document.createElement("tr");

    row.innerHTML = `
    <td>${user.user_id}</td>
    <td>${user.email}</td>
    <td>${user.number_of_requests}</td>

    <td>
      <select class="form-select" data-user-id="${user.user_id}">
        <option value="0" ${user.role === 0 ? "selected" : ""}>User</option>
        <option value="1" ${user.role === 1 ? "selected" : ""}>Admin</option>
      </select>
    </td>
    <td>
      <button class="btn btn-primary btn-update-role" data-user-id="${user.user_id}">Update Role</button>
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
}

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
