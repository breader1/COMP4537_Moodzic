const statusCode = {
    httpOk: 200,
}

const delayTimes = {
  twoSeconds: 2000,
}

const role = {
  admin: 1,
  user: 2,
  adminString: "Admin",
  userString: "User",
}

const httpMethod = {
  get: "GET",
  post: "POST",
  delete: "DELETE",
  patch: "PATCH",
}

const redirectLink = {
  home: "home.html",
  index: "index.html",
  resetpwd: "reset_password.html",
  auth: "authentication.html"
}

const serverEndpoints = {
  //https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net

  register: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/register",
  login: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/login",
  getAllUsersData: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/getAllUsersData",
  getEndpointsCalledByUser: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/getEndpointsCalledByUser",
  getNumberOfRequestsByEndpoint:
    "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/getNumberOfRequestsByEndpoint",
  incrementUserRequests: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/incrementUserRequests",
  requestPasswordReset: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/requestPasswordReset",
  resetPassword: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/resetPassword",
  updateRole: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/updateRole", // New endpoint
  llm: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/generate-audio",
  deleteUser: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/delete",
  verify: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/verify",
  logout: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/logout",

  // register: "http://localhost:3000/register",
  // login: "http://localhost:3000/login",
  // getAllUsersData: "http://localhost:3000/getAllUsersData",
  // getEndpointsCalledByUser: "http://localhost:3000/getEndpointsCalledByUser",
  // getNumberOfRequestsByEndpoint: "http://localhost:3000/getNumberOfRequestsByEndpoint",
  // incrementUserRequests: "http://localhost:3000/incrementUserRequests",
  // requestPasswordReset: "http://localhost:3000/requestPasswordReset",
  // resetPassword: "http://localhost:3000/resetPassword",
  // updateRole: "http://localhost:3000/updateRole",
  // llm: "http://localhost:3000/generate-audio",
  // deleteUser: "http://localhost:3000/delete",
  // verify: "http://localhost:3000/verify",
  // logout: "http://localhost:3000/logout",
};

// const llmEndpoint = {
//     llm: 'https://fresh-insect-severely.ngrok-free.app/generate-audio'
// }

 const userMessages = {
  emailEmpty: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  resetLinkError: "An error occurred while sending the reset link.",
  resetCodeEmpty: "Please enter the reset code.",
  passwordTooShort: "Password must be at least 3 characters long.",
  passwordMismatch: "Passwords do not match.",
  passwordResetSuccess: "Your password has been reset successfully!",
  generalError: "An error occurred. Please try again.",
  apiCallsInfo: "You have made {number} out of 20 free API calls.",
  apiCallsExceeded: "All free tokens have been used up. Your requests will still be processed.",
  apiCallsNone: "You have made 0 out of 20 free API calls.",
  apiCallsError: "Failed to retrieve API call information. Please try again later.",
  promptEmpty: "Please enter a prompt.",
  generatingAudio: "Generating audio",
  audioGenerationError: "Failed to generate audio. Please try again.",
  incrementRequestCountError: "Failed to increment request count. Please try again later.",
  incrementRequestCountAuthError: "Failed to increment request count: User not authenticated.",
  registrationSuccess: "Registration successful! You can now log in.",
  registrationError: "An error occurred during registration. Please try again later.",
  loginError: "An error occurred while logging in. Please try again later.",
  loginFailed: "Login failed. Please try again.",
  enterPassword: "Please enter your password.",
  notAuthorized: "You are not authorized to view this page.",
  userDataFetchError: "Error fetching user data. Please try again later.",
  deleteMessage: "Are you sure you want to delete this user?",
  deleteOption: "Delete User",
  deleteSuccess: "User deleted successfully.",
  deleteError: "An error occurred while deleting the user.",
  updateMessage: "Are you sure you want to update this user's role to {newRole}?",
  updateOption: "Update Role",
  updateSuccess: "Role updated successfully.",
  updateError: "An error occurred while updating the role.",
};





