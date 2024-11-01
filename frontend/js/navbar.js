document.addEventListener("DOMContentLoaded", function () {
  // Check login state from localStorage
  const isLoggedIn = localStorage.getItem('token') !== null;
  const userRole = localStorage.getItem('role');

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
  } else if (isLoggedIn && userRole === '0') {
    // Logged in as a regular user
    navbarHtml = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="home.html">Moodzic</a>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link" href="home.html">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="generator.html">Generator</a>
              </li>
            </ul>
          </div>
          <div class="d-flex">
            <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
          </div>
        </div>
      </nav>
    `;
  } else if (isLoggedIn && userRole === '1') {
    // Logged in as an admin
    navbarHtml = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="home.html">Moodzic</a>
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
          </div>
          <div class="d-flex">
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
    const logoutLink = document.getElementById('logout-link');
    logoutLink.addEventListener('click', function (event) {
      event.preventDefault();
      // Clear login state and redirect to login page
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('number_of_requests'); // optional, if you're tracking requests
      window.location.href = 'index.html';
    });
  }
});
