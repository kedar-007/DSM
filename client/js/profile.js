document.addEventListener("DOMContentLoaded", function () {
  // Function to check if user details exist in local storage
  const isUserLoggedIn = () => {
    return (
      localStorage.getItem("userName") &&
      localStorage.getItem("role") &&
      localStorage.getItem("email")
    );
  };

  // Function to redirect to login page if not logged in
  const redirectToLoginIfNotLoggedIn = () => {
    if (!isUserLoggedIn()) {
      window.location.href = "../auth_login.html";
    }
  };

  // Function to display user details in the modal
  const displayUserDetails = () => {
    const userName = localStorage.getItem("userName") || "N/A";
    const userRole = localStorage.getItem("role") || "N/A";
    const userEmail = localStorage.getItem("email") || "N/A";

    // Update modal content
    const modal = document.querySelector("#quick_user_toggle");
    if (modal) {
      modal.querySelector("#userName").textContent = `Name: ${userName}`;
      modal.querySelector("#userRole").textContent = `Role: ${userRole}`;
      const userEmailElement = modal.querySelector("#userEmail");
      userEmailElement.textContent = `Email: ${userEmail}`;
      userEmailElement.href = `mailto:${userEmail}`;
    }
  };

  // Add event listener to the toggle button
  document
    .querySelector(
      '[data-bs-toggle="modal"][data-bs-target="#quick_user_toggle"]'
    )
    .addEventListener("click", function () {
      if (isUserLoggedIn()) {
        displayUserDetails(); // Update details before showing
      } else {
        window.location.href = "../auth_login.html";
      }
    });

  // Add event listener to logout button
  document.querySelector("#logoutBtn").addEventListener("click", function () {
    localStorage.clear();
    window.location.href = "../auth_login.html";
  });

  // Redirect to login page if not logged in on page load
  redirectToLoginIfNotLoggedIn();
});
