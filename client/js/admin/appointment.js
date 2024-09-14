$(document).ready(function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  // Initialize DataTable
  let table = $("#appointments").DataTable({
    data: [],
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Name", data: "name" },
      { title: "Date", data: "date_time" },
      { title: "Doctor Assigned", data: "doctor_name" },
      { title: "Address", data: "address" },
      { title: "DOB", data: "date_of_birth" },
      { title: "Gender", data: "gender" },
      { title: "Phone", data: "phone_no" },
      { title: "Hospital", data: "hospital_name" },
      {
        title: "Status",
        data: null,
        render: function (data, type, row) {
          const status = data.status ? data.status.toUpperCase() : "UNKNOWN";
          const patientType = row.is_existing_patient
            ? '<span style="background-color: #e0ffe0; padding: 2px 4px; border-radius: 3px; color:green">Existing Patient</span>'
            : "New";
          return `${status} (${patientType})`;
        },
      },
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
    rowCallback: function (row, data, index) {
      let status = data.status ? data.status.toUpperCase() : "";
      let statusCell = $(row).find("td:eq(8)"); // Target the Status cell specifically

      // Reset background color for the Status cell
      statusCell.css("background-color", "");

      // Apply color based on status and patient type
      if (status === "PENDING") {
        statusCell.css("color", "#fb00af");
      } else if (status === "CANCELLED") {
        statusCell.css("color", "red");
      } else if (status === "ATTENDED") {
        statusCell.css("color", "green");
      } else if (status === "RESCHEDULED") {
        statusCell.css("color", "blue");
      } 
      else if(status === "COMPLETED"){
        statusCell.css("color", "green");
      }
      else {
        statusCell.css("color", "black"); // Default color for unknown statuses
      }
    },
  });

  // Function to fetch data
  function fetchData() {
    $("#loader").show(); // Show loader while fetching data

    fetch("/server/dental_management_function/admin/appointments")
      .then((response) => response.json())
      .then((appointments) => {
        return Promise.all([
          fetch("/server/dental_management_function/admin/doctors"),
          fetch("/server/dental_management_function/admin/hospitals"),
          fetch("/server/dental_management_function/admin/patients"),
        ]).then(async ([doctorsRes, hospitalsRes, patientsRes]) => {
          const [doctors, hospitals, patients] = await Promise.all([
            doctorsRes.json(),
            hospitalsRes.json(),
            patientsRes.json(),
          ]);

          const doctorMap = new Map(
            doctors.map((doc) => [doc.ROWID, doc.name])
          );
          const hospitalMap = new Map(
            hospitals.map((hospital) => [
              hospital.ROWID,
              hospital.hospital_name,
            ])
          );
          const patientMap = new Map(
            patients
              .filter((patient) => patient.phone_no !== undefined)
              .map((patient) => [patient.phone_no, patient])
          );

          // Filter appointments to show only "PENDING" status
          const pendingAppointments = appointments.filter(
            (item) => item.status && item.status.toUpperCase() !== ""
          );

          // console.log(appointments);

          // Map doctor and hospital IDs to names
          const updatedData = pendingAppointments.map((item) => ({
            ...item,
            doctor_name: doctorMap.get(item.doctor_id) || "Unknown Doctor",
            hospital_name:
              hospitalMap.get(item.hospital_id) || "Unknown Hospital",
            is_existing_patient: patientMap.has(item.phone_no), // Check patient existence
          }));

          table.clear().rows.add(updatedData).draw();
          $(".baller-container").hide();
          $(".content-wrapper").show();
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        $("#loader").hide(); // Hide loader in case of error
      });
  }

  // Initial fetch
  fetchData();

  // Handle Edit Button Click
  $("#appointments").on("click", ".edit-btn", function () {
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
  $("#appointments").on("click", ".save-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"]; // Get Appointment ID

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

      fetch(`/server/dental_management_function/admin/appointment/${rowID}`, {
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

              // Reload the page after the modal is completely hidden
              $("#successModal").on("hidden.bs.modal", function () {
                location.reload();
              });
            }, 1000); // You can adjust the delay time as needed
          } else {
            console.error("Error updating data:", data.message);
          }
        })
        .catch((error) => {
          $("#loader").hide();
          console.error("Error:", error);
        });
    }
  });

  // Handle Cancel Button Click
  $("#appointments").on("click", ".cancel-btn", function () {
    let row = $(this).closest("tr");

    $(row)
      .find("td:not(:last-child)")
      .each(function () {
        let cell = $(this);
        let originalValue = cell.data("original-value");
        cell.html(originalValue);
      });

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
  $("#appointments").on("click", ".delete-btn", function () {
    if (confirm("Are you sure you want to delete this record?")) {
      let row = $(this).closest("tr");
      let rowData = table.row(row).data();
      let rowID = rowData["ROWID"]; // Get Appointment ID

      $("#loader").show();

      fetch(`/server/dental_management_function/admin/appointment/${rowID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          $("#loader").hide();

          if (data.status === "success") {
            table.row(row).remove().draw();
            $("#successModal").modal("show");
            setTimeout(() => {
              $("#successModal").modal("hide");
            }, 1000); // You can adjust the delay time as needed
          } else {
            console.error("Error deleting data:", data.message);
          }
        })
        .catch((error) => {
          $("#loader").hide();
          console.error("Error:", error);
        });
    }
  });

  // Loader visibility and modal handling
  $("#loader").hide();
  $("#successModal").on("hidden.bs.modal", function () {
    location.reload();
  });
});
