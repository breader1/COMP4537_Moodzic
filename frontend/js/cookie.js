/**
 * ChatGPT was used in cookie.js to help ask questions, generate code, and check for logic errors.
 *
 * @fileoverview This script helps to grab a cookie value by name.
 *
 **/

// Function to get a cookie value by name
function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }