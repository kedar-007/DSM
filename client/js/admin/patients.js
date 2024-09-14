$(document).ready(function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();

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
      { title: "Date Check In", data: "date_of_admission" },
      { title: "Doctor Assigned", data: "doctor_name" }, // Changed to doctor_name
      { title: "Address", data: "address" },
      { title: "Status", data: "patient_status" },
      { title: "DOB", data: "date_of_birth" },
      { title: "Gender", data: "gender" },
      { title: "Phone", data: "phone" },
      { title: "Hospital", data: "hospital_name" }, // Changed to hospital_name
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
  fetch("/server/dental_management_function/admin/patients", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Clinic Data", data);
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
    .catch((error) => console.error("Error fetching patients data:", error));

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
  $("#patients").on("click", ".save-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"];

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
          $("#loader").hide();

          if (data.MODIFIEDTIME) {
            $("#successModal").modal("show");
            let updatedRowData = Object.assign(rowData, updatedData);
            table.row(row).data(updatedRowData).draw();
            $(row).find("td:last-child").html(`
              <button class="btn btn-blue edit-btn">
                <i class="fas fa-edit"></i> 
              </button>
              <button class="btn btn-red delete-btn">
                <i class="fas fa-trash"></i> 
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
          <i class="fas fa-edit"></i> 
        </button>
        <button class="btn btn-red delete-btn">
          <i class="fas fa-trash"></i> 
        </button>
      `);
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
    rowToDelete = $(this).closest("tr");
    $("#deleteModal").modal("show");
  });

  // Handle Confirm Delete in Modal
  $("#confirmDeleteBtn").on("click", function () {
    $("#loader").show();

    let rowData = table.row(rowToDelete).data();
    let patientId = rowData["ROWID"];

    fetch(`/server/dental_management_function/admin/patient/${patientId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        $("#loader").hide();

        if (data.message) {
          table.row(rowToDelete).remove().draw();
          $("#deleteModal").modal("hide");
        } else {
          console.error("Error deleting data:", data.message);
        }
      })
      .catch((error) => {
        $("#loader").hide();
        console.error("Error:", error);
      });
  });
});
