/**
 * ChatGPT was used in admin.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This code checks if a user is logged in by verifying a session token and, if authenticated,
 * fetches and displays user data in a table on the admin page.
 */

document.addEventListener("DOMContentLoaded", async () => {
  await fetch(serverEndpoints.verify, {
    method: httpMethod.get,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then(async (response) => {
    if (response.status !== statusCode.httpOk) {
      window.location.href = redirectLink.index;
    }
    const data = await response.json();
    if (data.Role !== role.admin) {
      window.location.href = redirectLink.home;
    }
  });

  fetchUsers();
  fetchEndpoints();
});

// Fetch and display users
function fetchUsers() {
  const apiUrl = serverEndpoints.getAllUsersData;

  fetch(apiUrl, {
    method: httpMethod.get,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        throw new Error(data.message);
      }
      displayUserData(data);
    })
    .catch(() => {
      displayPopup(userMessages.userDataFetchError, "error");
    });
}

// Fetch and display endpoints
function fetchEndpoints() {
  const endpointUrl = serverEndpoints.getNumberOfRequestsByEndpoint;

  fetch(endpointUrl, {
    method: httpMethod.get,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((responseData) => {
      if (!Array.isArray(responseData.data)) {
        throw new Error("Response data is not an array.");
      }
      displayUserEndpoint(responseData.data);
    })
    .catch(() => {
      displayPopup(userMessages.userDataFetchError, "error");
    });
}

// Display user data in a table
function displayUserData(data) {
  if (!Array.isArray(data)) {
    displayPopup(userMessages.userDataFetchError, "error");
    return;
  }

  const userContainer = document.querySelector(".userContainer");
  userContainer.innerHTML = ""; // Clear existing content

  const title = document.createElement("h3");
  title.textContent = "User Data";
  title.classList.add("table-title");
  userContainer.appendChild(title);

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered");

  const headers = `
    <thead class="table-dark">
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
    row.setAttribute("data-user-id", user.user_id);

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
  userContainer.appendChild(table);

  addEventListenersToButtons();
}

function addEventListenersToButtons() {
  const userContainer = document.querySelector(".userContainer");

  // Delegate click events for update role buttons
  userContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-update-role")) {
      const userId = event.target.getAttribute("data-user-id");
      const roleSelect = document.querySelector(`select[data-user-id="${userId}"]`);
      const newRole = roleSelect.value;
      showUpdateConfirmation(userId, newRole);
    }
  });

  // Delegate click events for delete user buttons
  userContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-delete-user")) {
      const userId = event.target.getAttribute("data-user-id");
      showDeleteConfirmation(userId);
    }
  });
}

// Display endpoint data in a table
function displayUserEndpoint(data) {
  const endpointContainer = document.querySelector(".endpointContainer");
  endpointContainer.innerHTML = ""; // Clear existing content

  const title = document.createElement("h3");
  title.textContent = "API Endpoint Total Requests";
  title.classList.add("table-title");
  endpointContainer.appendChild(title);

  const table = document.createElement("table");
  table.classList.add("table", "table-bordered");

  const headers = `
    <thead class="table-dark">
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
  endpointContainer.appendChild(table);
}

// Show delete confirmation modal
function showDeleteConfirmation(userId) {
  showModal(
    userMessages.deleteMessage,
    userMessages.deleteOption,
    () => deleteUser(userId)
  );
}

// Show update role confirmation modal
function showUpdateConfirmation(userId, newRole) {
  showModal(
    userMessages.updateMessage.replace("{newRole}", newRole === "1" ? role.adminString : role.userString),
    userMessages.updateOption,
    () => updateUserRole(userId, newRole)
  );
}

// Display popup notification
function displayPopup(message, type = "info") {
  const popup = document.createElement("div");
  popup.className = `popup-message ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}

function showModal(content, title, onConfirm) {
  const existingModal = document.querySelector(".modal-backdrop");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  modalContent.innerHTML = `
    <h4>${title}</h4>
    <p>${content}</p>
    <div class="modal-buttons">
      <button class="btn btn-primary" id="confirmModalAction">Confirm</button>
      <button class="btn btn-secondary" id="cancelModalAction">Cancel</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  const confirmButton = document.getElementById("confirmModalAction");
  const cancelButton = document.getElementById("cancelModalAction");

  confirmButton.addEventListener("click", () => {
    onConfirm();
    closeModal(modal);
  });

  cancelButton.addEventListener("click", () => {
    closeModal(modal);
  });
}


// Close modal
function closeModal(modal) {
  modal.remove();
}

// Delete user function
function deleteUser(userId) {

  fetch(`${serverEndpoints.deleteUser}/${userId}`, {
    method: httpMethod.delete,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      displayPopup(userMessages.deleteSuccess, "success");
      fetchUsers(); // Refresh the user table
    })
    .catch(() => {
      displayPopup(userMessages.deleteError, "error");
    });
}

// Update user role function
function updateUserRole(userId, newRole) {

  fetch(`${serverEndpoints.updateRole}/${userId}`, {
    method: httpMethod.patch,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: newRole }),
  })
    .then((response) => response.json())
    .then(() => {
      displayPopup(userMessages.updateSuccess, "success");
      fetchUsers(); // Refresh the user table
    })
    .catch(() => {
      displayPopup(userMessages.updateError, "error");
    });
}
