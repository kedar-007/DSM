var doctorId = localStorage.getItem("userId");

$(document).ready(function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  const doctorName = localStorage.getItem("userName") || "Doctor";
  // Set the innerHTML of the h4 element
  document.getElementById(
    "bills-title"
  ).innerHTML = `Bills Generated against ${doctorName}`;
  // Initialize DataTable
  let table = $("#bills").DataTable({
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
      { title: "Doctor Assigned", data: "doctor_name" },
      { title: "Amount", data: "Amount" },
      { title: "Status", data: "Status" },
      { title: "Phone", data: "phone" },
      { title: "Hospital", data: "hospital_name" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-blue edit-btn">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-red delete-btn">
            <i class="fas fa-trash"></i> Delete
          </button>
        `,
      },
    ],
    rowCallback: function (row, data) {
      let statusCell = $(row).find("td:eq(4)");
      let status = data.Status ? data.Status.toUpperCase() : "";

      if (status === "PAID") {
        statusCell.css("color", "green");
      } else if (status === "PENDING") {
        statusCell.css("color", "orange");
      } else if (status === "CANCELLED") {
        statusCell.css("color", "red");
      } else {
        statusCell.css("color", "black"); // Default color
      }
    },
  });

  // Fetch data from your backend API
  fetch(`/server/dental_management_function/doctor/bills/${doctorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);

      // Fetch doctors and hospitals names
      Promise.all([
        fetch("/server/dental_management_function/admin/doctors"),
        fetch("/server/dental_management_function/admin/hospitals"),
      ])
        .then(([doctorsRes, hospitalsRes]) =>
          Promise.all([doctorsRes.json(), hospitalsRes.json()])
        )
        .then(([doctors, hospitals]) => {
          const doctorMap = new Map(
            doctors.map((doc) => [doc.ROWID, doc.name])
          );
          const hospitalMap = new Map(
            hospitals.map((hospital) => [
              hospital.ROWID,
              hospital.hospital_name,
            ])
          );

          // Map doctor and hospital IDs to names
          const updatedData = data.map((item) => ({
            ...item,
            doctor_name: doctorMap.get(item.doctor_id) || "Unknown Doctor",
            hospital_name:
              hospitalMap.get(item.hospital_id) || "Unknown Hospital",
          }));

          table.clear().rows.add(updatedData).draw();
          $(".baller-container").hide();
          $(".content-wrapper").show();
        })
        .catch((error) =>
          console.error("Error fetching doctors or hospitals:", error)
        );
    })
    .catch((error) => console.error("Error fetching bills data:", error));

  // Handle Edit Button Click
  $("#bills").on("click", ".edit-btn", function () {
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
        <i class="fas fa-save"></i> Save
      </button>
      <button class="btn btn-blue cancel-btn">
        <i class="fas fa-times"></i> Cancel
      </button>
    `);
  });

  // Handle Save Button Click
  $("#bills").on("click", ".save-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"]; // Get Bill ID

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
          updatedData[columnName] = newValue;
        }
      });

    if (Object.keys(updatedData).length > 0) {
      updatedData["ROWID"] = rowID;

      $("#loader").show();

      fetch(`/server/dental_management_function/admin/bill/${rowID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((data) => {
          $("#loader").hide();

          if (data.MODIFIEDTIME) {
            $("#successModal").modal("show");
            let updatedRowData = Object.assign(rowData, updatedData);
            table.row(row).data(updatedRowData).draw();
            $(row).find("td:last-child").html(`
              <button class="btn btn-blue edit-btn">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-red delete-btn">
                <i class="fas fa-trash"></i> Delete
              </button>
            `);

            setTimeout(() => {
              $("#successModal").modal("hide");
            }, 2000);
          } else {
            console.error("Error updating data:", data.message);
          }
        })
        .catch((error) => {
          $("#loader").hide();
          console.error("Error:", error);
        });
    } else {
      console.log("No changes detected.");
      table.row(row).data(rowData).draw();
      $(row).find("td:last-child").html(`
        <button class="btn btn-blue edit-btn">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-red delete-btn">
          <i class="fas fa-trash"></i> Delete
        </button>
      `);
    }
  });

  // Handle Cancel Button Click
  $("#bills").on("click", ".cancel-btn", function () {
    let row = $(this).closest("tr");
    let originalData = table.row(row).data();
    table.row(row).data(originalData).draw();
    $(row).find("td:last-child").html(`
      <button class="btn btn-blue edit-btn">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button class="btn btn-red delete-btn">
        <i class="fas fa-trash"></i> Delete
      </button>
    `);
  });

  // Handle Delete Button Click
  $("#bills").on("click", ".delete-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let billID = rowData["ROWID"]; // Get Bill ID

    $("#confirmDeleteBtn")
      .off("click")
      .on("click", function () {
        $("#loader").show();

        fetch(`/server/dental_management_function/admin/bill/${billID}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer your_token",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            $("#loader").hide();

            if (data.DELETED) {
              $("#successModal").modal("show");
              table.row(row).remove().draw();
              setTimeout(() => {
                $("#successModal").modal("hide");
              }, 2000);
            } else {
              console.error("Error deleting data:", data.message);
            }
          })
          .catch((error) => {
            $("#loader").hide();
            console.error("Error:", error);
          });
      });

    $("#deleteModal").modal("show");
  });
});
