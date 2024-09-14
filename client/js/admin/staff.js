$(document).ready(function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  // Initialize DataTable
  let table = $("#UserTable").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Name", data: "name" },
      { title: "Email", data: "email" },
      { title: "Role", data: "role" }, // Assuming role_name is the role of the user
      { title: "Phone", data: "phone" },
      { title: "Hospital", data: "hospital_name" }, // Display hospital name
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-blue edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-red delete-btn" style="color:red" >
            <i class="fas fa-trash"></i> Delete
          </button>
        `,
      },
    ],
  });

  // Fetch data from your backend API
  fetch("/server/dental_management_function/admin/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Hey i am data", data);
      // Fetch hospital names
      fetch("/server/dental_management_function/admin/hospitals", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token",
        },
      })
        .then((response) => response.json())
        .then((hospitals) => {
          const hospitalMap = new Map(
            hospitals.map((hospital) => [
              hospital.ROWID,
              hospital.hospital_name,
            ])
          );

          // Map hospital IDs to names in the staff data
          const updatedData = data.map((staff) => ({
            ...staff,
            hospital_name:
              hospitalMap.get(staff.hospital_id) || "Unknown Hospital",
          }));

          table.clear().rows.add(updatedData).draw();
          $(".baller-container").hide();
          $(".content-wrapper").show();
        })
        .catch((error) =>
          console.error("Error fetching hospitals data:", error)
        );
    })
    .catch((error) => console.error("Error fetching staff data:", error));

  // Handle Edit Button Click
  $("#UserTable").on("click", ".edit-btn", function () {
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
  $("#UserTable").on("click", ".save-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    let updatedData = {};
    let rowID = rowData["ROWID"]; // Get Staff ID

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

      fetch(`/server/dental_management_function/admin/staff/${rowID}`, {
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
  $("#UserTable").on("click", ".cancel-btn", function () {
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
  $("#UserTable").on("click", ".delete-btn", function () {
    rowToDelete = $(this).closest("tr");
    $("#deleteModal").modal("show");
  });

  // Handle Confirm Delete in Modal
  $("#confirmDeleteBtn").on("click", function () {
    $("#loader").show();

    let rowData = table.row(rowToDelete).data();
    let staffId = rowData["ROWID"];

    fetch(`/server/dental_management_function/admin/staff/${staffId}`, {
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
