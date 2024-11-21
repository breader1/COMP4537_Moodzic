/**
 * ChatGPT was used in navbar.js to help ask questions, generate code, and check for logic errors.
 *
 * @fileoverview This script dynamically generates a navigation bar based on the user's
 * authentication and role, providing distinct options for logged-out users, regular users,
 * and admins. It also handles user logout functionality.
 **/

// const ADMIN = "1";
// const USER = "2";

// document.addEventListener("DOMContentLoaded", function () {
//   // const token = getCookie("jwt") !== null; // Use getCookie from cookie.js
//   const role = sessionStorage.getItem("role");

//   let navbarHtml;

//   // if (!token) {
//   //   // Logged out navbar (default)
//   //   navbarHtml = `
//   //   <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
//   //     <div class="container-fluid">
//   //       <a class="navbar-brand" href="index.html">Moodzic</a>
//   //       <div class="d-flex">
//   //         <a class="nav-link text-white" href="authentication.html">Login/Register</a>
//   //       </div>
//   //     </div>
//   //   </nav>
//   //   `;
//   // } else 
//   if (role === USER) {
//     // Logged in as a regular user
//     navbarHtml = `
//     <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
//       <div class="container-fluid">
//         <a class="navbar-brand" href="home.html">Moodzic</a>
//         <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
//           <span class="navbar-toggler-icon"></span>
//         </button>
//         <div class="collapse navbar-collapse" id="navbarNav">
//           <ul class="navbar-nav me-auto mb-2 mb-lg-0">
//             <li class="nav-item">
//               <a class="nav-link" href="home.html">Home</a>
//             </li>
//             <li class="nav-item">
//               <a class="nav-link" href="generator.html">Generator</a>
//             </li>
//           </ul>
//           <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
//         </div>
//       </div>
//     </nav>
//     `;
//   } else if (role === ADMIN) {
//     // Logged in as an admin
//     navbarHtml = `
//     <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
//       <div class="container-fluid">
//         <a class="navbar-brand" href="home.html">Moodzic</a>
//         <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
//           <span class="navbar-toggler-icon"></span>
//         </button>
//         <div class="collapse navbar-collapse" id="navbarNav">
//           <ul class="navbar-nav me-auto mb-2 mb-lg-0">
//             <li class="nav-item">
//               <a class="nav-link" href="home.html">Home</a>
//             </li>
//             <li class="nav-item">
//               <a class="nav-link" href="generator.html">Generator</a>
//             </li>
//             <li class="nav-item">
//               <a class="nav-link" href="admin.html">Admin</a>
//             </li>
//           </ul>
//           <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
//         </div>
//       </div>
//     </nav>
//     `;
//   } else {
//     navbarHtml = `
//     <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
//       <div class="container-fluid">
//         <a class="navbar-brand" href="index.html">Moodzic</a>
//         <div class="d-flex">
//           <a class="nav-link text-white" href="authentication.html">Login/Register</a>
//         </div>
//       </div>
//     </nav>
//     `;
//   }

//   // Insert the generated navbar into the page
//   document.body.insertAdjacentHTML("afterbegin", navbarHtml);

//   // Add event listener for Logout link if user is logged in
//   if (token) {
//     const logoutLink = document.getElementById("logout-link");
//     logoutLink.addEventListener("click", function (event) {
//       event.preventDefault();
//       // Clear login state and redirect to login page
//       sessionStorage.removeItem("role");
//       document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//       window.location.href = "index.html";
//     });
//   }
// });



const ADMIN = "1";
const USER = "2";

document.addEventListener("DOMContentLoaded", function () {
  const role = sessionStorage.getItem("role");

  let navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="${role === ADMIN || role === USER ? 'home.html' : 'index.html'}">Moodzic</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
  `;

  if (role === USER || role === ADMIN) {
    // Add common links for logged-in users
    navbarHtml += `
            <li class="nav-item">
              <a class="nav-link" href="home.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="generator.html">Generator</a>
            </li>
    `;
    // Add admin-specific link
    if (role === ADMIN) {
      navbarHtml += `
            <li class="nav-item">
              <a class="nav-link" href="admin.html">Admin</a>
            </li>
      `;
    }
    // Add logout link for both roles
    navbarHtml += `
          </ul>
          <a class="nav-link text-white" href="#" id="logout-link">Logout</a>
        </div>
      </div>
    </nav>
    `;
  } else {
    // Add default links for logged-out users
    navbarHtml += `
          </ul>
          <div class="d-flex">
            <a class="nav-link text-white" href="authentication.html">Login/Register</a>
          </div>
        </div>
      </div>
    </nav>
    `;
  }

  // Insert the generated navbar into the page
  document.body.insertAdjacentHTML("afterbegin", navbarHtml);

  // Add event listener for Logout link if applicable
  if (role === USER || role === ADMIN) {
    const logoutLink = document.getElementById("logout-link");
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      // Clear login state and redirect to login page
      sessionStorage.removeItem("role");
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "index.html";
    });
  }
});