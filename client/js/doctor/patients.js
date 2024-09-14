var currPatientId;
$(document).ready(function () {
  // Hide the table initially
  $(".content-wrapper").hide();

  // Extract doctorId from localStorage
  const doctorId = localStorage.getItem("userId");

  let table = $("#patients").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Patient Name", data: "patient_name" },
      { title: "Date of Admission", data: "date_of_admission" },
      { title: "Address", data: "address" },
      { title: "Status", data: "patient_status" },
      { title: "DOB", data: "date_of_birth" },
      { title: "Gender", data: "gender" },
      { title: "Phone", data: "phone" },
      { title: "Hospital", data: "hospital_name" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-blue edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-red delete-btn" style="color:red">
            <i class="fas fa-trash"></i> 
          </button>
          <button class="btn btn-green add-treatment-btn" style="color:green" data-bs-toggle="modal" data-bs-target="#full-width-modal">
            <i class="fas fa-plus"></i> 
          </button>
          <button class="btn view-history-btn" data-bs-toggle="modal" data-bs-target="#view-history-modal"">
            <i class="fas fa-eye"></i> 
          </button>
        `,
      },
    ],
  });

  // Fetch data from your backend API
  fetch(`/server/dental_management_function/doctor/${doctorId}/patients/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Fetch hospitals names only
      fetch("/server/dental_management_function/admin/hospitals")
        .then((hospitalsRes) => hospitalsRes.json())
        .then((hospitals) => {
          const hospitalMap = new Map(
            hospitals.map((hospital) => [
              hospital.ROWID,
              hospital.hospital_name,
            ])
          );

          // Map hospital IDs to names
          const updatedData = data.map((item) => ({
            ...item,
            hospital_name:
              hospitalMap.get(item.hospital_id) || "Unknown Hospital",
          }));

          // Add the data to the table
          table.clear().rows.add(updatedData).draw();

          // Hide the spinner and show the table
          $(".baller-container").hide();
          $(".content-wrapper").show();
        })
        .catch((error) => {
          console.error("Error fetching hospitals:", error);
          $(".baller-container").hide();
          $(".content-wrapper").show();
        });
    })
    .catch((error) => {
      console.error("Error fetching patients data:", error);
      $(".baller-container").hide();
      $(".content-wrapper").hide();
    });

  // Handle Edit Button Click
  $("#patients").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    $(row)
      .find("td:not(:last-child)")
      .each(function () {
        let cell = $(this);
        let text = cell.text().trim();
        cell.data("original-value", text);
        cell.html(
          `<input type="text" value="${text}" class="form-control" data-column="${cell.index()}" />`
        );
      });

    $(row).find("td:last-child").html(`
      <button class="btn btn-green save-btn">
        <i class="fas fa-save"></i> 
      </button>
      <button class="btn btn-blue cancel-btn">
        <i class="fas fa-times"></i>
      </button>
    `);
  });

  // View history button
  $("#patients").on("click", ".view-history-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Get the patient ID for fetching the treatment history
    currPatientId = rowData.ROWID;

    // Populate the modal with patient details
    $("#historyPatientName").text(rowData.patient_name);
    $("#historyAdmissionDate").text(rowData.date_of_admission);
    $("#historyPatientAddress").text(rowData.address);
    $("#historyPatientStatus").text(rowData.patient_status);
    $("#historyPatientDOB").text(rowData.date_of_birth);
    $("#historyPatientGender").text(rowData.gender);
    $("#historyPatientPhone").text(rowData.phone);
    $("#historyHospitalName").text(rowData.hospital_name);

    // Fetch treatment history for the current patient
    fetch(
      `/server/dental_management_function/doctor/patient/${currPatientId}/history`
    )
      .then((response) => response.json())
      .then((historyData) => {
        // Clear the table body
        $("#historyBody").empty();

        if (historyData.length === 0) {
          // If no history data is available, show a message
          $("#historyBody").append(`
          <tr>
            <td colspan="9" class="text-center">No patient treatment history found.</td>
          </tr>
        `);
        } else {
          // Sort the historyData by CREATEDTIME in descending order (latest first)
          historyData.sort(
            (a, b) => new Date(b.CREATEDTIME) - new Date(a.CREATEDTIME)
          );

          historyData.forEach((history) => {
            const treatmentDetails = history.treatement_details
              .split("|")
              .map((detail) => detail.trim());

            treatmentDetails.forEach((detail) => {
              let [treatmentType, ...rest] = detail
                .split(",")
                .map((item) => item.trim());

              // Find the index where duration (e.g., '1 day', '7 days') appears in the array
              let durationIndex = rest.findIndex((item) =>
                item.match(/\d+\s+day/)
              );

              if (durationIndex !== -1) {
                // Extract medicines (all data before the duration)
                let medicines = rest.slice(0, durationIndex).join(", ");

                // Extract duration and other details (from durationIndex onwards)
                let [duration, dosage, notes, advice] =
                  rest.slice(durationIndex);

                // Append each treatment row to the table
                $("#historyBody").append(`
                <tr>
                  <td>${history.CREATEDTIME}</td>
                  <td>${history.doctor_name}</td>
                  <td>${history.hospital_name}</td>
                  <td>${treatmentType}</td>
                  <td>${medicines}</td>
                  <td>${duration}</td>
                  <td>${dosage}</td>
                  <td>${notes || "No notes"}</td>
                  <td>${advice || "No advice"}</td>
                </tr>
              `);
              } else {
                console.error("Duration not found in treatment details.");
              }
            });
          });
        }

        // Show the modal
        $("#view-history-modal").modal("show");
      })
      .catch((error) => {
        console.error("Error fetching treatment history:", error);
        // If there's an error, display a message
        $("#historyBody").empty().append(`
        <tr>
          <td colspan="9" class="text-center text-danger">Error fetching treatment history. Please try again later.</td>
        </tr>
      `);
      });
  });

  // Handle Save Button Click
  $("#patients").on("click", ".save-btn", function (e) {
    e.preventDefault();

    // Show the baller loader
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

    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"]; // Assuming ROWID is the identifier for patients

    $(row)
      .find("td:not(:last-child)")
      .each(function () {
        let cell = $(this);
        let input = cell.find("input");
        let originalValue = cell.data("original-value");
        let newValue = input.val();

        if (newValue !== originalValue) {
          let columnName = table
            .column(cell.index())
            .header()
            .textContent.trim();
          updatedData[columnName.toLowerCase()] = newValue;
        }
      });

    if (Object.keys(updatedData).length > 0) {
      updatedData["ROWID"] = rowID;

      fetch(`/server/dental_management_function/admin/patient/${rowID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((data) => {
          $(".baller-container").hide();
          if (data.MODIFIEDTIME) {
            let updatedRowData = Object.assign(rowData, updatedData);
            table.row(row).data(updatedRowData).invalidate().draw(false);
            swal(
              "Success!",
              "The patient information has been successfully updated.",
              "success"
            );

            $(row)
              .find("td:not(:last-child)")
              .each(function () {
                let cell = $(this);
                cell.html(cell.find("input").val());
              });

            $(row).find("td:last-child").html(`
              <button class="btn btn-blue edit-btn">
                <i class="fas fa-edit"></i> 
              </button>
              <button class="btn btn-red delete-btn">
                <i class="fas fa-trash"></i> 
              </button>
            `);
          } else {
            swal("Error", "Failed to update patient information.", "error");
          }
        })
        .catch((error) => {
          $(".baller-container").hide();
          swal(
            "Error",
            "Error updating patient information: " + error.message,
            "error"
          );
        });
    } else {
      $(".baller-container").hide();
      swal("Info", "No changes detected.", "info");
      table.row(row).data(rowData).draw();
    }
  });

  // Handle Cancel Button Click
  $("#patients").on("click", ".cancel-btn", function () {
    let row = $(this).closest("tr");
    let originalData = table.row(row).data();
    table.row(row).data(originalData).draw();
    $(row).find("td:last-child").html(`
      <button class="btn btn-blue edit-btn">
        <i class="fas fa-edit"></i> 
      </button>
      <button class="btn btn-red delete-btn">
        <i class="fas fa-trash"></i> 
      </button>
    `);
  });

  // Handle Delete Button Click
  $("#patients").on("click", ".delete-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this patient's record!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#fec801",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: false,
        closeOnCancel: false,
      },
      function (isConfirm) {
        if (isConfirm) {
          fetch(`/server/dental_management_function/admin/patient/${rowID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer your_token",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              // console.log(data);
              if (data.message === "Patient deleted successfully") {
                swal(
                  "Deleted!",
                  "The patient record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete patient record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting patient record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The patient record is safe.", "error");
        }
      }
    );
  });

  // Handle Add Treatment Button Click
  $("#patients").on("click", ".add-treatment-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // console.log("Here is another rowData", rowData);

    currPatientId = rowData.ROWID;
    // patient_id = $("#patientName").text(rowData.patient_name);
    // console.log("Patient_id", patient_id);

    // Populate the modal with patient details
    $("#patientName").text(rowData.patient_name);
    $("#admissionDate").text(rowData.date_of_admission);
    $("#patientAddress").text(rowData.address);
    $("#patientStatus").text(rowData.patient_status);
    $("#patientDOB").text(rowData.date_of_birth);
    $("#patientGender").text(rowData.gender);
    $("#patientPhone").text(rowData.phone);
    $("#hospitalName").text(rowData.hospital_name);

    // Fetch and populate available treatments
    fetch(`/server/dental_management_function/doctor/treatments`)
      .then((response) => response.json())
      .then((services) => {
        let treatmentDropdown = $(".treatment-type");
        treatmentDropdown.empty(); // Clear existing options
        treatmentDropdown.append('<option value="">Select Treatment</option>');
        services.forEach((service) => {
          treatmentDropdown.append(
            `<option value="${service.Category}">${service.ServiceName}</option>`
          );
        });
        treatmentDropdown.append('<option value="other">Other</option>'); // Add 'Other' option
      })
      .catch((error) => {
        console.error("Error fetching treatments:", error);
      });

    // Show the modal
    $("#full-width-modal").modal("show");
  });

  // Handle treatment type selection to populate medicines with checkboxes
  $("#treatmentTable").on("change", ".treatment-type", function () {
    let selectedCategory = $(this).val();
    let medicineContainer = $(this)
      .closest("tr")
      .find(".medicine-dropdown-container");

    if (selectedCategory === "other") {
      // If 'Other' is selected, allow manual input
      medicineContainer.html(
        '<input type="text" class="form-control" placeholder="Enter medicine">'
      );
    } else {
      // Fetch and populate medicines based on the selected treatment category with checkboxes
      fetch(`/server/dental_management_function/doctor/medicines`)
        .then((response) => response.json())
        .then((medicines) => {
          let filteredMedicines = medicines.filter(
            (med) => med.Category === selectedCategory
          );
          let medicineCheckboxes = filteredMedicines.map((med) => {
            return `
              <div class="form-check">
                <input class="form-check-input medicine-checkbox" type="checkbox" value="${med.medicine_name}" id="medicine-${med.ROWID}">
                <label class="form-check-label" for="medicine-${med.ROWID}">
                  ${med.medicine_name}
                </label>
              </div>
            `;
          });

          // Insert the checkboxes into the container
          medicineContainer.html(medicineCheckboxes.join(""));
        })
        .catch((error) => {
          console.error("Error fetching medicines:", error);
        });
    }
  });

  // Handle Add Treatment Button Click
  $("#patients").on("click", ".add-treatment-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Store patientId and doctorId in hidden inputs or directly in JS variables
    $("#patientId").val(rowData.ROWID); // Assuming `ROWID` is the patient ID
    $("#doctorId").val(doctorId); // doctorId comes from localStorage

    // Populate the modal with patient details
    $("#patientName").text(rowData.patient_name);
    $("#admissionDate").text(rowData.date_of_admission);
    $("#patientAddress").text(rowData.address);
    $("#patientStatus").text(rowData.patient_status);
    $("#patientDOB").text(rowData.date_of_birth);
    $("#patientGender").text(rowData.gender);
    $("#patientPhone").text(rowData.phone);
    $("#hospitalName").text(rowData.hospital_name);

    // Fetch and populate available treatments
    fetch(`/server/dental_management_function/doctor/treatments`)
      .then((response) => response.json())
      .then((services) => {
        let treatmentDropdown = $(".treatment-type");
        treatmentDropdown.empty(); // Clear existing options
        treatmentDropdown.append('<option value="">Select Treatment</option>');
        services.forEach((service) => {
          treatmentDropdown.append(
            `<option value="${service.Category}">${service.ServiceName}</option>`
          );
        });
        treatmentDropdown.append('<option value="other">Other</option>'); // Add 'Other' option
      })
      .catch((error) => {
        console.error("Error fetching treatments:", error);
      });

    // Show the modal
    $("#full-width-modal").modal("show");
  });

  // Handle treatment type selection to populate medicines with checkboxes
  $("#treatmentTable").on("change", ".treatment-type", function () {
    let selectedCategory = $(this).val();
    let medicineContainer = $(this)
      .closest("tr")
      .find(".medicine-dropdown-container");

    if (selectedCategory === "other") {
      // If 'Other' is selected, allow manual input
      medicineContainer.html(
        '<input type="text" class="form-control" placeholder="Enter medicine">'
      );
    } else {
      // Fetch and populate medicines based on the selected treatment category with checkboxes
      fetch(`/server/dental_management_function/doctor/medicines`)
        .then((response) => response.json())
        .then((medicines) => {
          let filteredMedicines = medicines.filter(
            (med) => med.Category === selectedCategory
          );
          let medicineCheckboxes = filteredMedicines.map((med) => {
            return `
            <div class="form-check">
              <input class="form-check-input medicine-checkbox" type="checkbox" value="${med.medicine_name}" id="medicine-${med.ROWID}">
              <label class="form-check-label" for="medicine-${med.ROWID}">
                ${med.medicine_name}
              </label>
            </div>
          `;
          });

          // Insert the checkboxes into the container
          medicineContainer.html(medicineCheckboxes.join(""));
        })
        .catch((error) => {
          console.error("Error fetching medicines:", error);
        });
    }
  });

  // Handle Add Treatment Row Button Click
  $(".add-treatment-row-btn").on("click", function () {
    let newRow = `
  <tr>
    <td>
      <select class="form-control treatment-type">
        <option value="">Select Treatment</option>
        <!-- Options will be populated dynamically -->
      </select>
    </td>
    <td class="medicine-dropdown-container">
      <!-- Medicines checkboxes will be populated dynamically -->
    </td>
    <td>
      <select class="form-control treatment-duration">
        <option value="1 day">1 day</option>
        <option value="7 days">7 days</option>
        <option value="14 days">14 days</option>
        <option value="custom">Custom</option>
      </select>
      <input type="number" class="form-control custom-duration" placeholder="Enter duration" style="display:none;">
    </td>
    <td>
      <select class="form-control treatment-dosage">
        <option value="1x">1x</option>
        <option value="2x">2x</option>
        <option value="3x">3x</option>
      </select>
    </td>
    <td>
      <input type="text" class="form-control treatment-notes" placeholder="Enter notes">
    </td>
    <td>
      <input type="text" class="form-control treatment-advice" placeholder="Enter advice">
    </td>
    <td>
      <button type="button" class="btn btn-danger remove-treatment-row-btn">
        <i class="fas fa-minus"></i>
      </button>
    </td>
  </tr>
  `;

    $("#treatmentTable tbody").append(newRow);

    // Re-populate treatment type dropdown with services
    let treatmentDropdown = $(".treatment-type:last");
    fetch(`/server/dental_management_function/doctor/treatments`)
      .then((response) => response.json())
      .then((services) => {
        treatmentDropdown.empty(); // Clear existing options
        treatmentDropdown.append('<option value="">Select Treatment</option>');
        services.forEach((service) => {
          treatmentDropdown.append(
            `<option value="${service.Category}">${service.ServiceName}</option>`
          );
        });
        treatmentDropdown.append('<option value="other">Other</option>'); // Add 'Other' option
      })
      .catch((error) => {
        console.error("Error fetching treatments:", error);
      });
  });

  // Remove a treatment row
  $("#treatmentTable").on("click", ".remove-treatment-row-btn", function () {
    $(this).closest("tr").remove();
  });

  // Handle custom duration field visibility
  $("#treatmentTable").on("change", ".treatment-duration", function () {
    if ($(this).val() === "custom") {
      $(this).closest("td").find(".custom-duration").show();
    } else {
      $(this).closest("td").find(".custom-duration").hide();
    }
  });

  // Handle Save Treatment Button Click
  $(".save-treatment-btn").on("click", function () {
    let treatmentDetailsText = [];

    // Disable the save button to prevent multiple submissions
    $(".save-treatment-btn").prop("disabled", true);

    // Loop through each row in the treatment table to collect treatment data
    $("#treatmentTable tbody tr").each(function () {
      let treatmentType = $(this).find(".treatment-type").val();
      let medicines = [];
      $(this)
        .find(".medicine-checkbox:checked")
        .each(function () {
          medicines.push($(this).val());
        });

      let duration = $(this).find(".treatment-duration").val();
      if (duration === "custom") {
        duration = $(this).find(".custom-duration").val() + " days";
      }

      let dosage = $(this).find(".treatment-dosage").val();
      let notes = $(this).find("#treatmentNotes").val();
      let advice = $(this).find("#treatmentAdvice").val();

      // Format the treatment details in the required format
      if (treatmentType && medicines.length > 0 && duration && dosage) {
        const treatmentDetail = `${treatmentType}, ${medicines.join(
          ", "
        )}, ${duration}, ${dosage}, ${notes || "No notes"}, ${
          advice || "No advice"
        }`;
        treatmentDetailsText.push(treatmentDetail);
      }
    });

    // Get patientId and doctorId from hidden fields
    const doctorName = localStorage.getItem("userName");
    const hospitalName = $("#hospitalName").text();

    // Combine the treatment details into a single string for pushing to the backend
    let treatmentData = {
      doctorName: doctorName,
      patientId: currPatientId,
      hospitalName: hospitalName,
      treatmentDetails: treatmentDetailsText.join(" | "), // Join each treatment as a single string with separator
    };

    console.log("Treatement data", treatmentData);

    // Send treatment data to backend API
    fetch(
      `/server/dental_management_function/doctor/patient/addtreatement/${currPatientId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
        body: JSON.stringify(treatmentData),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // On successful submission
        if (data.CREATEDTIME) {
          swal("Success!", "The treatment has been added.", "success");

          // Close the modal and reset the button after the alert
          $("#full-width-modal").modal("hide");
          $(".save-treatment-btn").prop("disabled", false);
          $(".modal-backdrop").remove(); // Remove the modal overlay
        } else {
          // If the submission fails, show an error
          swal("Error", "Failed to add treatment.", "error");
          $(".save-treatment-btn").prop("disabled", false); // Enable the button again
        }
      })
      .catch((error) => {
        // On error, show a message and re-enable the button
        swal("Error", "Error adding treatment: " + error.message, "error");
        $(".save-treatment-btn").prop("disabled", false);
      });
  });

  // Handle Print Prescription Button Click
  $("#print-prescription-btn").on("click", function () {
    let treatments = [];

    // Loop through each row in the treatment table to collect treatment data
    $("#treatmentTable tbody tr").each(function () {
      let treatmentType = $(this).find(".treatment-type").val();
      let medicines = [];
      $(this)
        .find(".medicine-checkbox:checked")
        .each(function () {
          medicines.push($(this).val());
        });
      let duration = $(this).find(".treatment-duration").val();
      if (duration === "custom") {
        duration = $(this).find(".custom-duration").val() + " days";
      }
      let dosage = $(this).find(".treatment-dosage").val();

      if (treatmentType && medicines.length > 0 && duration && dosage) {
        treatments.push({
          treatmentType,
          medicines,
          duration,
          dosage,
        });
      }
    });

    // Fetch doctor name from local storage or set a default name
    let doctor_name = localStorage.getItem("userName") || "Dr. John Doe";

    // Collect other data for prescription
    let rowData = {
      doctor_name: doctor_name,
      hospital_name: $("#hospitalName").text(),
      patient_name: $("#patientName").text(),
      treatments,
    };

    // Generate the prescription in a new window
    let prescriptionWindow = window.open("", "_blank");
    prescriptionWindow.document.write(`
    <html>
    <head>
      <title>Prescription</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; background-color: #f9f9f9; }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo img { width: 100px; }
        h1 { text-align: center; margin-bottom: 40px; }
        p { font-size: 18px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid black; padding: 10px; }
        th { background-color: #f2f2f2; text-align: left; }
        td { vertical-align: top; }
        .signature { margin-top: 50px; text-align: right; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="../images/logo-letter.png" alt="Logo">
        </div>
        <h1>Prescription</h1>
        <p><strong>Doctor:</strong> ${rowData.doctor_name}</p>
        <p><strong>Hospital:</strong> ${rowData.hospital_name}</p>
        <p><strong>Patient:</strong> ${rowData.patient_name}</p>
        <table>
          <thead>
            <tr>
              <th>Treatment Type</th>
              <th>Medicines</th>
              <th>Duration</th>
              <th>Dosage</th>
            </tr>
          </thead>
          <tbody>
            ${rowData.treatments
              .map(
                (treatment) => `
              <tr>
                <td>${treatment.treatmentType}</td>
                <td>${treatment.medicines.join(", ")}</td>
                <td>${treatment.duration}</td>
                <td>${treatment.dosage}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="signature">
          <p>Doctor's Signature:</p>
          <p class="signature-name">${rowData.doctor_name}</p>
        </div>
      </div>
    </body>
    </html>
  `);

    // Close and print the prescription
    prescriptionWindow.document.close();
    prescriptionWindow.print();
  });
});
