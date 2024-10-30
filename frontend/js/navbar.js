document.addEventListener("DOMContentLoaded", function () {
  // Check login state from localStorage
  // const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
          <a class="navbar-brand" href="index.html">Moodzic</a>
          <div class="d-flex">
              <a class="nav-link text-white" href="login.html">Login/Register</a>
          </div>
      </div>
    </nav>
    `;

  document.body.insertAdjacentHTML("afterbegin", navbarHtml);
});
