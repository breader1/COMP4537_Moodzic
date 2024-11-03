/**
 * ChatGPT was used in navbar.js to help ask questions, generate code, and check for logic errors.
 * 
 * @fileoverview This script dynamically generates a navigation bar based on the user's
 * authentication and role, providing distinct options for logged-out users, regular users,
 * and admins. It also handles user logout functionality.
 **/


document.addEventListener("DOMContentLoaded", function () {
  // Check login state from sessionStorage
  const isLoggedIn = sessionStorage.getItem("token") !== null;
  const userRole = sessionStorage.getItem("role");

  let navbarHtml;

  if (!isLoggedIn) {
    // Logged out navbar (default)
    navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="index.html">Moodzic</a>
        <div class="d-flex">
          <a class="nav-link text-white" href="authentication.html">Login/Register</a>
        </div>
      </div>
    </nav>
    `;
  } else if (isLoggedIn && userRole === "0") {
    // Logged in as a regular user
    navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="home.html">Moodzic</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="home.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="generator.html">Generator</a>
            </li>
          </ul>
          <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
        </div>
      </div>
    </nav>
    `;
  } else if (isLoggedIn && userRole === "1") {
    // Logged in as an admin
    navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="home.html">Moodzic</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="home.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="generator.html">Generator</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="admin.html">Admin</a>
            </li>
          </ul>
          <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
        </div>
      </div>
    </nav>
    `;
  }

  // Insert the generated navbar into the page
  document.body.insertAdjacentHTML("afterbegin", navbarHtml);

  // Add event listener for Logout link if user is logged in
  if (isLoggedIn) {
    const logoutLink = document.getElementById("logout-link");
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      // Clear login state and redirect to login page
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("email");
      window.location.href = "index.html";
    });
  }
});
