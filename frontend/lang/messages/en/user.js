const method = {
    post: 'POST',
    get: 'GET'
}

const serverEndpoints = {
  // register: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/register',
  // login: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/login',
  // getAllUsersData: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/getAllUsersData',
  // getUserNumberOfRequests: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/getUserNumberOfRequests',
  // incrementUserRequests: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/incrementUserRequests',
  // requestPasswordReset: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/requestPasswordReset',
  // resetPassword: 'https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/resetPassword'
  register: "http://localhost:3000/register",
  login: "http://localhost:3000/login",
  getAllUsersData: "http://localhost:3000/getAllUsersData",
  getEndpointsCalledByUser: "http://localhost:3000/getEndpointsCalledByUser",
  incrementUserRequests: "http://localhost:3000/incrementUserRequests",
  requestPasswordReset: "http://localhost:3000/requestPasswordReset",
  resetPassword: "http://localhost:3000/resetPassword",
  updateRole: "http://localhost:3000/updateRole", // New endpoint
  llm: "http://localhost:3000/generate-audio",
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
    resetProcessError: "An error occurred. Please try again.",
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
};




