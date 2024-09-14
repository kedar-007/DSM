document.addEventListener("DOMContentLoaded", function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  // Function to create a card dynamically
  const createCard = (clinic) => {
    const statusColor = clinic.Status === "Active" ? "green" : "red";
    return `
      <div class="col mb-4">
        <div class="card" data-clinic-id="${
          clinic.ROWID
        }" style="position: relative; display: flex; flex-direction: column; height: 100%; min-height: 400px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 10px; overflow: hidden;">
          <img
            class="card-img-top"
            src="../images/svg-icon/medical/3.png"
            alt="Clinic Image"
            style="width: 50%; height: auto; object-fit: cover; border-radius: 10px 10px 0 0; max-height: 180px;"
          />
          <div class="card-body" style="flex: 1; padding: 0.75rem; background-color: #f9f9f9;">
            <h4 class="card-title fw-500 b-0 px-0" style="font-size: 1.5rem; color: #333;">
              <span class="clinic-name" style="display: block; font-weight: bold; font-size: 1.75rem;">${
                clinic.hospital_name
              }</span>
              <input type="text" class="form-control clinic-name-input" value="${
                clinic.hospital_name
              }" style="display: none; width: 100%; max-width: 300px; font-size: 1.75rem;" />
            </h4>
            <p class="text-gray-600" style="margin: 0; font-size: 0.9rem; color: #555;">
              <span class="clinic-location" style="display: block; margin-bottom: 5px;"><strong style="color: black;">Location:</strong> <span style="color: black;">${
                clinic.location
              }</span></span>
              <input type="text" class="form-control clinic-location-input" value="${
                clinic.location
              }" style="display: none; width: 100%; max-width: 300px;" />
              <span class="clinic-email" style="display: block; font-size: 0.875rem; color: black; margin-bottom: 5px;"><strong style="color: black;">Email:</strong> <span style="color: black;">${
                clinic.email
              }</span></span>
              <input type="text" class="form-control clinic-email-input" value="${
                clinic.email
              }" style="display: none; width: 100%; max-width: 300px;" />
              <span class="clinic-phone" style="display: block; font-size: 0.875rem; color: black; margin-bottom: 5px;"><strong style="color: black;">Phone:</strong> <span style="color: black;">${
                clinic.phone_number
              }</span></span>
              <input type="text" class="form-control clinic-phone-input" value="${
                clinic.phone_number
              }" style="display: none; width: 100%; max-width: 300px;" />
              <span class="clinic-hours" style="display: block; font-size: 0.875rem; color: black; margin-bottom: 5px;"><strong style="color: black;">Operating Hours:</strong> <span style="color: black;">${
                clinic.operating_hours
              }</span></span>
              <input type="text" class="form-control clinic-hours-input" value="${
                clinic.operating_hours
              }" style="display: none; width: 100%; max-width: 300px;" />
              <span class="clinic-status" style="display: block; font-size: 0.9rem; color: black; font-weight: bold;"><strong>Status:</strong> <span class="status-text" style="color: ${statusColor};">${
      clinic.Status
    }</span><select class="form-select status-select" style="display: none; width: 100%; max-width: 150px;"><option value="Active" ${
      clinic.Status === "Active" ? "selected" : ""
    }>Active</option><option value="Closed" ${
      clinic.Status === "Closed" ? "selected" : ""
    }>Closed</option></select></span>
              <span class="text-muted" style="display: block; font-size: 0.8rem; margin-top: 10px;"><strong>Created on:</strong> ${
                clinic.CREATEDTIME
              }</span>
              <span class="text-muted" style="display: block; font-size: 0.8rem;"><strong>Last updated on:</strong> ${
                clinic.MODIFIEDTIME
              }</span>
            </p>
          </div>
          <div class="card-footer" style="padding: 0.75rem; background-color: #ffffff; border-top: 1px solid #dee2e6; border-radius: 0 0 10px 10px; display: flex; justify-content: flex-start; gap: 0.3rem; margin-top: auto;">
            <button class="btn edit-btn" style="background-color: #ffc107; border: none; color: white; border-radius: 5px; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="editClinic('${
              clinic.ROWID
            }')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn delete-btn" style="background-color: #dc3545; border: none; color: white; border-radius: 5px; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deleteClinic('${
              clinic.ROWID
            }')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn view-btn" style="background-color: white; border: none; color: #007bff; border-radius: 5px; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: bold;" onclick="viewClinicDetails('${
              clinic.ROWID
            }')">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Fetch clinics data from the backend API
  fetch("/server/dental_management_function/admin/hospitals")
    .then((response) => response.json())
    .then((data) => {
      console.log("Clinics", data);
      const clinicsContainer = document.querySelector("#clinics");
      if (clinicsContainer) {
        data.forEach((clinic) => {
          clinicsContainer.innerHTML += createCard(clinic);
        });
      }
      $(".baller-container").hide();
      $(".content-wrapper").show();
    })
    .catch((error) => console.error("Error fetching clinics data:", error));
});

// Function to handle viewing clinic details
function viewClinicDetails(clinicId) {
  window.location.href = `clinic_details.html?clinicId=${clinicId}`;
}

// Function to handle edit action
function editClinic(clinicId) {
  const card = document.querySelector(`.card[data-clinic-id="${clinicId}"]`);

  if (card) {
    const nameSpan = card.querySelector(".clinic-name");
    const nameInput = card.querySelector(".clinic-name-input");
    const locationSpan = card.querySelector(".clinic-location");
    const locationInput = card.querySelector(".clinic-location-input");
    const emailSpan = card.querySelector(".clinic-email");
    const emailInput = card.querySelector(".clinic-email-input");
    const phoneSpan = card.querySelector(".clinic-phone");
    const phoneInput = card.querySelector(".clinic-phone-input");
    const hoursSpan = card.querySelector(".clinic-hours");
    const hoursInput = card.querySelector(".clinic-hours-input");
    const statusText = card.querySelector(".status-text");
    const statusSelect = card.querySelector(".status-select");
    const footer = card.querySelector(".card-footer");

    // Toggle visibility of text and input fields
    const isEditing = nameInput.style.display === "block";
    nameSpan.style.display = isEditing ? "block" : "none";
    nameInput.style.display = isEditing ? "none" : "block";
    locationSpan.style.display = isEditing ? "block" : "none";
    locationInput.style.display = isEditing ? "none" : "block";
    emailSpan.style.display = isEditing ? "block" : "none";
    emailInput.style.display = isEditing ? "none" : "block";
    phoneSpan.style.display = isEditing ? "block" : "none";
    phoneInput.style.display = isEditing ? "none" : "block";
    hoursSpan.style.display = isEditing ? "block" : "none";
    hoursInput.style.display = isEditing ? "none" : "block";
    statusText.style.display = isEditing ? "block" : "none";
    statusSelect.style.display = isEditing ? "none" : "block";

    // Highlight or unhighlight fields
    const highlightStyle = "2px solid green";
    const defaultBorderStyle = "none";
    nameInput.style.border = isEditing ? highlightStyle : defaultBorderStyle;
    locationInput.style.border = isEditing
      ? highlightStyle
      : defaultBorderStyle;
    emailInput.style.border = isEditing ? highlightStyle : defaultBorderStyle;
    phoneInput.style.border = isEditing ? highlightStyle : defaultBorderStyle;
    hoursInput.style.border = isEditing ? highlightStyle : defaultBorderStyle;
    statusSelect.style.border = isEditing ? highlightStyle : defaultBorderStyle;

    // Add or remove save and cancel buttons
    let saveButton = card.querySelector(".save-btn");
    let cancelButton = card.querySelector(".cancel-btn");

    if (!isEditing) {
      if (!saveButton) {
        saveButton = document.createElement("button");
        saveButton.className = "btn save-btn";
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save';
        saveButton.onclick = () => saveClinic(clinicId);
        saveButton.style.backgroundColor = "#28a745";
        saveButton.style.border = "none";
        saveButton.style.color = "white";
        saveButton.style.borderRadius = "5px";
        saveButton.style.padding = "0.25rem 0.5rem";
        saveButton.style.fontSize = "0.75rem";
        footer.appendChild(saveButton);
      }
      if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.className = "btn cancel-btn";
        cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancel';
        cancelButton.onclick = () => cancelEdit(clinicId);
        cancelButton.style.backgroundColor = "#dc3545";
        cancelButton.style.border = "none";
        cancelButton.style.color = "white";
        cancelButton.style.borderRadius = "5px";
        cancelButton.style.padding = "0.25rem 0.5rem";
        cancelButton.style.fontSize = "0.75rem";
        footer.appendChild(cancelButton);
      }
    } else {
      // Remove save and cancel buttons if editing is done
      if (saveButton) {
        saveButton.remove();
      }
      if (cancelButton) {
        cancelButton.remove();
      }
    }
  }
}

// Function to handle cancel action
function cancelEdit(clinicId) {
  const card = document.querySelector(`.card[data-clinic-id="${clinicId}"]`);

  if (card) {
    const nameSpan = card.querySelector(".clinic-name");
    const nameInput = card.querySelector(".clinic-name-input");
    const locationSpan = card.querySelector(".clinic-location");
    const locationInput = card.querySelector(".clinic-location-input");
    const emailSpan = card.querySelector(".clinic-email");
    const emailInput = card.querySelector(".clinic-email-input");
    const phoneSpan = card.querySelector(".clinic-phone");
    const phoneInput = card.querySelector(".clinic-phone-input");
    const hoursSpan = card.querySelector(".clinic-hours");
    const hoursInput = card.querySelector(".clinic-hours-input");
    const statusText = card.querySelector(".status-text");
    const statusSelect = card.querySelector(".status-select");

    // Toggle visibility of text and input fields
    nameSpan.style.display = "block";
    nameInput.style.display = "none";
    locationSpan.style.display = "block";
    locationInput.style.display = "none";
    emailSpan.style.display = "block";
    emailInput.style.display = "none";
    phoneSpan.style.display = "block";
    phoneInput.style.display = "none";
    hoursSpan.style.display = "block";
    hoursInput.style.display = "none";
    statusText.style.display = "block";
    statusSelect.style.display = "none";

    // Remove save and cancel buttons
    const footer = card.querySelector(".card-footer");
    const saveButton = card.querySelector(".save-btn");
    const cancelButton = card.querySelector(".cancel-btn");

    if (saveButton) {
      saveButton.remove();
    }
    if (cancelButton) {
      cancelButton.remove();
    }

    // Remove highlight from fields
    const fields = [
      card.querySelector(".clinic-name-input"),
      card.querySelector(".clinic-location-input"),
      card.querySelector(".clinic-email-input"),
      card.querySelector(".clinic-phone-input"),
      card.querySelector(".clinic-hours-input"),
      card.querySelector(".status-select"),
    ];
    fields.forEach((field) => (field.style.border = "none"));
  }
}

// Function to save clinic details
function saveClinic(clinicId) {
  const card = document.querySelector(`.card[data-clinic-id="${clinicId}"]`);

  if (card) {
    const nameInput = card.querySelector(".clinic-name-input");
    const locationInput = card.querySelector(".clinic-location-input");
    const emailInput = card.querySelector(".clinic-email-input");
    const phoneInput = card.querySelector(".clinic-phone-input");
    const hoursInput = card.querySelector(".clinic-hours-input");
    const statusSelect = card.querySelector(".status-select");
    const saveButton = card.querySelector(".save-btn");
    const cancelButton = card.querySelector(".cancel-btn");

    // Collect updated data
    const updatedClinic = {
      hospital_name: nameInput.value,
      location: locationInput.value,
      email: emailInput.value,
      phone_number: phoneInput.value,
      operating_hours: hoursInput.value,
      Status: statusSelect.value,
    };

    console.log("Updated Clinic Data:", updatedClinic);

    // Send updated data to the server
    fetch(`/server/dental_management_function/admin/hospital/${clinicId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedClinic),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Update response:", data);
        if (data.MODIFIEDTIME) {
          // Update was successful
          // Update the card with new values
          card.querySelector(".clinic-name").textContent =
            updatedClinic.hospital_name;
          card.querySelector(".clinic-location").textContent =
            updatedClinic.location;
          card.querySelector(".clinic-email").textContent = updatedClinic.email;
          card.querySelector(".clinic-phone").textContent =
            updatedClinic.phone_number;
          card.querySelector(".clinic-hours").textContent =
            updatedClinic.operating_hours;
          const statusElement = card.querySelector(".clinic-status");
          statusElement.innerHTML = `<strong>Status:</strong> <span class="status-text" style="color: ${
            statusSelect.value === "Active" ? "green" : "red"
          };">${statusSelect.value}</span>`;

          // Hide the Save and Cancel buttons
          if (saveButton) saveButton.remove();
          if (cancelButton) cancelButton.remove();

          // Show success alert
          showAlert("Clinic details updated successfully!", "success");
          cancelEdit(clinicId); // Return to view mode
        } else {
          // Handle error
          alert("Failed to update clinic details.");
        }
      })
      .catch((error) => console.error("Error saving clinic data:", error));
  }
}

// Function to show alert messages
function showAlert(message, type) {
  const alertContainer = document.createElement("div");
  alertContainer.className = `alert ${type}`;
  alertContainer.textContent = message;

  // Create and append style element
  const style = document.createElement("style");
  style.textContent = `
    .alert {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 15px;
      border-radius: 5px;
      color: #fff;
      font-size: 16px;
      z-index: 1000;
    }
    .alert.success {
      background-color: #4CAF50; /* Green color */
    }
    .alert.error {
      background-color: #f44336; /* Red color */
    }
  `;
  document.head.appendChild(style);

  // Add the alert to the body or another container
  document.body.appendChild(alertContainer);

  // Remove the alert after a few seconds
  setTimeout(() => {
    alertContainer.remove();
  }, 3000);
}

// Function to handle delete action
function deleteClinic(clinicId) {
  if (confirm("Are you sure you want to delete this clinic?")) {
    fetch(`/server/dental_management_function/admin/hospital/${clinicId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Delete response:", data);
        // Remove card from UI if deletion is successful
        if (data.message) {
          const card = document.querySelector(
            `.card[data-clinic-id="${clinicId}"]`
          );
          if (card) {
            card.remove();
          }
        } else {
          alert("Failed to delete clinic.");
        }
      })
      .catch((error) => console.error("Error deleting clinic:", error));
  }
}
