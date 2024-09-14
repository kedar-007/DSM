document.addEventListener("DOMContentLoaded", function () {
  // Fetch and populate hospitals when the page loads
  fetch("/server/dental_management_function/admin/hospitals")
    .then((response) => response.json())
    .then((data) => {
      const hospitalSelect = document.getElementById("hospitalSelect");
      data.forEach((hospital) => {
        const option = document.createElement("option");
        option.value = hospital.ROWID; // Send this value to backend
        option.text = hospital.hospital_name;
        hospitalSelect.add(option);
      });
    });

  // Fetch doctors when a hospital is selected
  document
    .getElementById("hospitalSelect")
    .addEventListener("change", function () {
      const hospitalId = this.value;
      if (hospitalId) {
        fetch(`/server/dental_management_function/admin/${hospitalId}/doctors`)
          .then((response) => response.json())
          .then((data) => {
            const doctorSelect = document.getElementById("doctorSelect");
            doctorSelect.innerHTML = '<option value="">Select Doctor</option>'; // Reset doctor dropdown
            data.forEach((doctor) => {
              const option = document.createElement("option");
              option.value = doctor.ROWID; // Send this value to backend
              option.text = doctor.name;
              doctorSelect.add(option);
            });
            doctorSelect.disabled = false; // Enable the doctor dropdown
          });
      } else {
        document.getElementById("doctorSelect").disabled = true;
      }
    });

  // Handle form submission
  document
    .getElementById("addPatientForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent default form submission
      const loader = document.getElementById("loader");
      const alertMessage = document.getElementById("alertMessage");

      loader.style.display = "block"; // Show loader
      alertMessage.style.display = "none"; // Hide alert

      const formatDateTime = (dateTime) => {
        const dateObj = new Date(dateTime);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const formData = {
        patient_name: `${
          document.querySelector('input[name="first_name"]').value
        } ${document.querySelector('input[name="last_name"]').value}`, // Concatenate first and last names
        phone: document.querySelector('input[name="phone"]').value,
        address: document.querySelector('input[name="address"]').value,
        date_of_birth: document.querySelector('input[name="date_of_birth"]')
          .value,
        gender: document.querySelector('select[name="gender"]').value,
        hospital_id: document.getElementById("hospitalSelect").value, // Pass the hospital ID
        doctor_id: document.getElementById("doctorSelect").value, // Pass the doctor ID
        date_of_admission: formatDateTime(
          document.querySelector('input[name="date_of_admission"]').value
        ), // Format the date
        patient_status: document.querySelector('select[name="patient_status"]')
          .value,
      };

      console.log(formData);

      fetch("/server/dental_management_function/admin/patient", {
        // Replace with your actual endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          loader.style.display = "none"; // Hide loader
          alertMessage.className = "alert alert-success"; // Set alert type
          alertMessage.innerHTML = "Patient added successfully!"; // Success message
          alertMessage.style.display = "block"; // Show alert

          // Hide the alert after 5 seconds
          setTimeout(() => {
            alertMessage.style.display = "none";
          }, 5000);

          // Clear the form after successful submission
          document.getElementById("addPatientForm").reset();
        })
        .catch((error) => {
          loader.style.display = "none"; // Hide loader
          alertMessage.className = "alert alert-danger"; // Set alert type
          alertMessage.innerHTML = "Failed to add patient! Please try again."; // Error message
          alertMessage.style.display = "block"; // Show alert

          // Hide the alert after 5 seconds
          setTimeout(() => {
            alertMessage.style.display = "none";
          }, 100);
        });
    });
});
