$(document).ready(function () {
  // Initially hide the loader
  $(".baller-container").hide();

  // Populate the hospital dropdown
  fetch("/server/dental_management_function/admin/hospitals", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const hospitalSelect = $("#hospitalSelect");
      data.forEach((hospital) => {
        hospitalSelect.append(
          `<option value="${hospital.ROWID}">${hospital.hospital_name}</option>`
        );
      });
    })
    .catch((error) => console.error("Error fetching hospitals:", error));

  // Show specialization dropdown if Doctor role is selected
  $("#roleSelect").change(function () {
    const role = $(this).val();
    const specializationContainer = $("#specializationContainer");

    if (role === "Doctor") {
      specializationContainer.show();
    } else {
      specializationContainer.hide();
    }
  });

  // Handle form submission
  $("#addStaffForm").on("submit", function (e) {
    e.preventDefault();

    // Show the ball loader
    $(".baller-container")
      .css({
        display: "flex", // Display the loader container
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        "z-index": "9999",
        "flex-direction": "row", // Align balls horizontally
        "justify-content": "center", // Center horizontally
        "align-items": "center", // Center vertically
      })
      .show();

    const formData = {
      name: $('input[name="name"]').val(),
      email: $('input[name="email"]').val(),
      password: $('input[name="password"]').val(),
      phone: $('input[name="phone"]').val(),
      role: $('select[name="role"]').val(),
      hospital_id: $('select[name="hospital_id"]').val(),
      status: $('select[name="status"]').val(),
      specialization: $('select[name="specialization"]').val() || null, // Include specialization if Doctor is selected
    };

    console.log(formData);

    fetch("/server/dental_management_function/admin/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response data", data);
        if (data) {
          // Programmatically trigger the modal
          $("#success-alert-modal").modal("show");

          // Reset the form
          $("#addStaffForm")[0].reset();

          // Hide specialization field after reset
          $("#specializationContainer").hide();
        } else {
          console.error("Error adding staff:", data.message);
        }
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        // Hide the ball loader
        $(".baller-container").hide();
      });
  });
});
