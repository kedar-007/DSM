var currPatientId;
$(document).ready(function () {
  var hospitalId = localStorage.getItem("hospitalId");
  console.log("Here is the hospital id", hospitalId);
  // Hide the table initially
  $(".content-wrapper").hide();

  // Extract doctorId from localStorage
  // const doctorId = localStorage.getItem("userId");

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
        `,
      },
    ],
  });

  // Fetch data from your backend API
  fetch(
    `/server/dental_management_function/receptionist/${hospitalId}/patient/all`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
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
});
