/**
 * @fileoverview This script checks if the user is logged in or not and redirects them to the
 * home page if they are logged in.
 **/

document.addEventListener("DOMContentLoaded", async function () {
  await fetch(serverEndpoints.verify, {
    method: httpMethod.get,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (response) => {
    if (response.status === statusCode.httpOk) {
      window.location.href = redirectLink.home;
    }
  });
});
