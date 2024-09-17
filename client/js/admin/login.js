document.addEventListener("DOMContentLoaded", function () {
  // Select the form
  const loginForm = document.querySelector("#loginForm");

  // Add event listener for form submission
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Show the loader and apply the blur effect
    document.querySelector(".loader").style.display = "block";
    document.querySelector(".blur-content").classList.add("blurred");

    // Gather form data for email and password
    const email = loginForm.querySelector('input[type="text"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    // Prepare the data to be sent in the POST request
    const requestData = {
      email: email,
      password: password,
    };

    // Send the POST request to the backend for login
    fetch("/server/dms_function/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        // Check the status code and handle potential errors
        if (!response.ok) {
          // Error handling based on specific status codes
          if (response.status === 400) {
            throw { message: "Email and password are required.", code: 400 };
          } else if (response.status === 401) {
            throw { message: "Invalid email or password.", code: 401 };
          } else if (response.status === 404) {
            throw { message: "User not found.", code: 404 };
          } else {
            throw {
              message: "An error occurred. Please try again later.",
              code: response.status,
            };
          }
        }
        return response.json(); // Proceed to parse JSON data if the response is OK
      })
      .then((data) => {
        // Store user details in local storage based on the user's role
        const role = (data.role || "ADMIN").toUpperCase();
        if (role === "ADMIN") {
          localStorage.setItem("email", data.email);
          localStorage.setItem("role", data.role);
          localStorage.setItem("userName", data.userName);
        } else if (role === "DEALER") {
          localStorage.setItem("email", data.email);
          localStorage.setItem("role", data.role);
          localStorage.setItem("dealerId", data.dealerId);
          localStorage.setItem("userName", data.userName);
        } else if (role === "TECHNICIAN") {
          localStorage.setItem("email", data.email);
          localStorage.setItem("role", data.role);
          localStorage.setItem("dealerId", data.dealerId);
          localStorage.setItem("userName", data.userName);
          localStorage.setItem("technicianId", data.technicianId);
        } else {
          // Default storage for other roles if needed
          localStorage.setItem("email", data.email);
          localStorage.setItem("role", data.role || "Admin");
          localStorage.setItem("userName", data.userName);
        }

        // Show a brief message indicating redirection and then redirect the user
        swal("Redirecting...", "Please wait while we redirect you.", "info", {
          buttons: false,
          timer: 500, // Short delay for redirection message
        });

        // Redirect the user based on their role after a brief delay
        setTimeout(() => {
          if (role === "DEALER") {
            window.location.href = "./doctor/index.html";
          } else if (role === "TECHNICIAN") {
            window.location.href = "./receptionist/serviceHistory.html";
          } else {
            window.location.href = "./admin/index.html"; // Default redirection to 'admin' page
          }
        }, 100); // Short delay before redirect
      })
      .catch((error) => {
        // Handle and display error messages based on the error encountered
        swal(
          "Error",
          error.message || "An error occurred. Please try again later.",
          "error"
        );
      })
      .finally(() => {
        // Hide the loader and remove the blur effect after completion
        document.querySelector(".loader").style.display = "none";
        document.querySelector(".blur-content").classList.remove("blurred");
      });
  });
});
