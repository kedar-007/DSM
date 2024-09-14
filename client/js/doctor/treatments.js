$(document).ready(function () {
  // Hide the table initially
  $(".content-wrapper").hide();

  // Extract doctorId from localStorage
  const doctorId = localStorage.getItem("userId");

  let table = $("#treatements").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Treatment Name", data: "ServiceName" },
      { title: "Category", data: "Category" },
      { title: "Cost", data: "Cost" },
      { title: "Description", data: "description" },
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
        `,
      },
    ],
  });

  // Fetch data from your backend API for treatments
  fetch(`/server/dental_management_function/doctor/treatments`, {
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

      // Hide the spinner and show the table
      $(".baller-container").hide();
      $(".content-wrapper").show();
    })
    .catch((error) => {
      console.error("Error fetching treatments data:", error);
      $(".baller-container").hide();
      $(".content-wrapper").hide();
    });

  // Handle Edit Button Click
  $("#treatements").on("click", ".edit-btn", function () {
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
  $("#treatements").on("click", ".save-btn", function (e) {
    e.preventDefault();

    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"]; // Assuming ROWID is the identifier for treatments

    // Iterate over each cell and compare input values with original values
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

    // Proceed if there are changes in the data
    if (Object.keys(updatedData).length > 0) {
      // Make the fetch call without passing ROWID in the body, just in the URL
      fetch(`/server/dental_management_function/doctor/treatement/${rowID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.MODIFIEDTIME) {
            let updatedRowData = Object.assign(rowData, updatedData);
            table.row(row).data(updatedRowData).invalidate().draw(false);
            swal(
              "Success!",
              "The treatment information has been successfully updated.",
              "success"
            );

            // Revert row to non-editable mode after update
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
            swal("Error", "Failed to update treatment information.", "error");
          }
        })
        .catch((error) => {
          swal(
            "Error",
            "Error updating treatment information: " + error.message,
            "error"
          );
        });
    } else {
      swal("Info", "No changes detected.", "info");
      table.row(row).data(rowData).draw();
    }
  });

  // Handle Cancel Button Click
  $("#treatements").on("click", ".cancel-btn", function () {
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
  $("#treatements").on("click", ".delete-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this treatment record!",
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
          fetch(
            `/server/dental_management_function/doctor/treatement/${rowID}`,
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
              if (data.message === "Treatment deleted successfully") {
                swal(
                  "Deleted!",
                  "The treatment record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete treatment record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting treatment record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The treatment record is safe.", "error");
        }
      }
    );
  });

  // Add Treatment Button (+ sign at top of the data table)
  $("#add-treatment-btn").on("click", function () {
    $("#full-width-modal").modal("show");
  });

  // Handle Save Treatment Button Click in Modal (Add new treatment)
  $(".save-treatment-btn").on("click", function () {
    const newTreatmentData = {
      ServiceName: $("#serviceName").val(),
      Category: $("#category").val(),
      Cost: $("#cost").val(),
      description: $("#description").val(),
    };

    if (
      !newTreatmentData.ServiceName ||
      !newTreatmentData.Category ||
      !newTreatmentData.Cost ||
      !newTreatmentData.description
    ) {
      swal("Error", "Please fill in all the fields.", "error");
      return;
    }

    console.log("Treatement type data has been consoled", newTreatmentData);

    fetch(`/server/dental_management_function/doctor/addServices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(newTreatmentData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.status === 200) {
          // Add new treatment to the table
          table.row.add(newTreatmentData).draw(false);

          // Reset form and close modal
          $("#serviceName").val("");
          $("#category").val("");
          $("#cost").val("");
          $("#description").val("");
          $("#full-width-modal").modal("hide");

          swal(
            "Success!",
            "The treatment has been successfully added.",
            "success"
          );
        } else {
          swal("Error", "Failed to add treatment.", "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error adding treatment: " + error.message, "error");
      });
  });
});
