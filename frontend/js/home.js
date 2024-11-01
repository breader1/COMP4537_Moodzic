document.addEventListener("DOMContentLoaded", function () {
    const apiCalls = localStorage.getItem('number_of_requests') || 0; // Retrieve number of API calls
    document.getElementById('apiCallsInfo').textContent = `You have used ${apiCalls} out of 20 free API calls.`;
});
