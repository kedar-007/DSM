$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  // Initialize DataTable for the list of medicines
  let table = $("#medicines").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Medicine Name", data: "medicine_name" },
      { title: "Category", data: "Category" },
      { title: "Description", data: "Description" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm  edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm  delete-medicine-btn" style="color:red">
            <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
  });

  // Fetch data from your backend API for medicines
  fetch(`/server/dental_management_function/doctor/medicines`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Add the data to the table
      table.clear().rows.add(data).draw();
      $(".content-wrapper").show(); // Show the content wrapper
      $(".baller-container").hide(); // Hide the loader
    })
    .catch((error) => {
      console.error("Error fetching medicines data:", error);
      $(".baller-container").hide(); // Hide the loader in case of error
      $(".content-wrapper").hide(); // Hide the content wrapper in case of error
      swal("Error", "Failed to load medicines data: " + error.message, "error");
    });

  // Handle Edit Button Click
  $("#medicines").on("click", ".edit-btn", function () {
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

  // Handle Save Button Click
  $("#medicines").on("click", ".save-btn", function (e) {
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

      fetch(`/server/dental_management_function/doctor/medicine/${rowID}`, {
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
              <button class="btn btn-blue edit-medicine-btn">
                <i class="fas fa-edit"></i> 
              </button>
              <button class="btn btn-red  delete-medicine-btn">
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
  $("#medicines").on("click", ".cancel-btn", function () {
    let row = $(this).closest("tr");
    let originalData = table.row(row).data();
    table.row(row).data(originalData).draw();
    $(row).find("td:last-child").html(`
      <button class="btn btn-blue edit-medicine-btn">
        <i class="fas fa-edit"></i> 
      </button>
      <button class="btn btn-red  delete-medicine-btn">
        <i class="fas fa-trash"></i> 
      </button>
    `);
  });

  // Handle Delete Button Click
  $("#medicines").on("click", ".delete-medicine-btn", function () {
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
          fetch(`/server/dental_management_function/doctor/medicine/${rowID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer your_token",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              // console.log(data);
              if (data.success === true) {
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

  // Add new medicine functionality
  let medicineList = []; // To store multiple medicines

  // Show the medicine modal when the button is clicked
  $("#add-medicine-btn").on("click", function () {
    $("#medicine-modal").modal("show");
  });

  // Add another medicine to the list
  $("#add-another-medicine").on("click", function () {
    const newMedicine = {
      medicine_name: $("#medicineName").val(),
      Category: $("#category").val(),
      Description: $("#medicineDescription").val(),
    };

    if (!newMedicine.medicine_name || !newMedicine.Description) {
      swal("Error", "Please fill in all the fields.", "error");
      return;
    }

    // Add new medicine to list and display it in the table
    medicineList.push(newMedicine);
    appendMedicineToTable(newMedicine);

    // Reset the fields for a new entry
    $("#medicineName").val("");
    $("#medicineDescription").val("");

    swal("Info", "Medicine added to the list. Add more if needed.", "info");
  });

  // Append medicine to the table with edit and remove buttons
  function appendMedicineToTable(medicine) {
    const tableBody = $("#medicine-table tbody");
    const rowIndex = tableBody.children().length; // Current row index

    const row = `<tr data-index="${rowIndex}">
                  <td class="editable" data-field="medicine_name">${medicine.medicine_name}</td>
                  <td class="editable" data-field="Category">${medicine.Category}</td>
                  <td class="editable" data-field="Description">${medicine.Description}</td>
                  <td>
                    <button class="btn btn-sm btn-primary edit-medicine-btn">Edit</button>
                    <button class="btn btn-sm btn-danger remove-medicine-btn">Remove</button>
                  </td>
                </tr>`;

    tableBody.append(row);
    attachRowEvents(); // Attach events to new rows
  }

  // Attach edit and remove events to the rows
  function attachRowEvents() {
    // Handle Edit Button Click
    $(".edit-medicine-btn")
      .off()
      .on("click", function () {
        const row = $(this).closest("tr");
        const rowIndex = row.data("index");

        // Toggle between edit mode and save mode
        if ($(this).text() === "Edit") {
          $(this).text("Save");

          // Make the row fields editable
          row.find(".editable").each(function () {
            const field = $(this).data("field");
            const value = $(this).text();
            $(this).html(
              `<input type="text" class="form-control" value="${value}" data-field="${field}">`
            );
          });
        } else {
          // Save the changes
          const updatedMedicine = {};
          row.find("input").each(function () {
            const field = $(this).data("field");
            const value = $(this).val();
            updatedMedicine[field] = value;
          });

          // PUT request to update the backend
          fetch(
            `/server/dental_management_function/doctor/updateMedicine/${rowIndex}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer your_token",
              },
              body: JSON.stringify(updatedMedicine),
            }
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.status === 200) {
                // Update the table with the new values
                row.find(".editable").each(function () {
                  const field = $(this).data("field");
                  $(this).html(updatedMedicine[field]);
                });

                $(this).text("Edit"); // Toggle back to Edit mode
                swal("Success!", "Medicine updated successfully.", "success");
              } else {
                swal("Error", "Failed to update medicine.", "error");
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error updating medicine: " + error.message,
                "error"
              );
            });
        }
      });

    // Handle Remove Button Click
    $(".remove-medicine-btn")
      .off()
      .on("click", function () {
        const row = $(this).closest("tr");
        const rowIndex = row.data("index");

        // Confirmation before deletion
        swal({
          title: "Are you sure?",
          text: "This action will delete the medicine permanently.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        }).then((willDelete) => {
          if (willDelete) {
            // DELETE request to remove the medicine from the backend
            fetch(
              `/server/dental_management_function/doctor/deleteMedicine/${rowIndex}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer your_token",
                },
              }
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.status === 200) {
                  row.remove(); // Remove the row from the table
                  swal("Deleted!", "Medicine has been deleted.", "success");
                } else {
                  swal("Error", "Failed to delete medicine.", "error");
                }
              })
              .catch((error) => {
                swal(
                  "Error",
                  "Error deleting medicine: " + error.message,
                  "error"
                );
              });
          }
        });
      });
  }

  // Handle Save Medicine Button Click in Modal (Save all added medicines)
  $(".save-medicine-btn").on("click", function () {
    if (medicineList.length === 0) {
      swal("Error", "Please add at least one medicine.", "error");
      return;
    }

    fetch(`/server/dental_management_function/doctor/addMedicines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(medicineList),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 200) {
          // Add medicines to the DataTable directly
          medicineList.forEach((medicine) =>
            table.row.add(medicine).draw(false)
          );

          // Reset form fields and modal
          $("#medicineName").val("");
          $("#medicineDescription").val("");
          $("#medicine-modal").modal("hide");
          $("#medicine-table tbody").empty(); // Clear the manual list
          medicineList = []; // Reset the medicine list

          swal(
            "Success!",
            "Medicines have been successfully added.",
            "success"
          );
        } else {
          swal("Error", "Failed to add medicines.", "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error adding medicines: " + error.message, "error");
      });
  });

  // Handle Excel File Upload (Limit to 200 records)
  $("#excel-upload").on("change", function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      console.log("Excel/CSV Data:", sheet); // Log the file data

      if (sheet.length > 200) {
        swal(
          "Error",
          "The file contains more than 200 records. Please upload a smaller file.",
          "error"
        );
        return;
      }

      // Add each medicine from the Excel file to the list and table
      sheet.forEach((row) => {
        const newMedicine = {
          medicine_name: row["Medicine Name"],
          Category: row["Category"],
          Description: row["Description"],
        };
        medicineList.push(newMedicine);
        appendMedicineToTable(newMedicine); // Add to the temporary table
      });

      swal(
        "Success!",
        "Medicines from Excel have been added to the list.",
        "success"
      );
    };

    reader.readAsArrayBuffer(file);
  });

  // Remove file button logic to reset the file upload
  $("#remove-file").on("click", function () {
    $("#excel-upload").val(""); // Clear file input
    $("#medicine-table tbody").empty(); // Clear table
    $(this).hide(); // Hide remove button
    swal("File removed!", "You can upload a new file.", "info");
  });
});
