$(document).ready(function () {
  // Initialize DataTable for the list of technicians
  let table = $("#technicians").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Technician Name", data: "TechnicianName" },
      { title: "Email", data: "Email" },
      { title: "Phone", data: "Phone" },
      { title: "Specialization", data: "specialization" },
      {
        title: "Technician ID",
        data: "ROWID",
        render: function (data, type, row) {
          return data ? "TL" + data.slice(-4) : "N/A"; // Show last 4 digits prefixed with TL
        },
      },
      {
        title: "Dealer ID",
        data: "DealerID",
        render: function (data, type, row) {
          return data ? "DL" + data.slice(-4) : "N/A"; // Show last 4 digits prefixed with DL
        },
      },
      {
        title: "Actions",
        data: null,
        defaultContent: `
                  <button class="btn btn-sm edit-btn" style="color:blue">
                      <i class="fas fa-edit"></i> 
                  </button>
                  <button class="btn btn-sm delete-technician-btn" style="color:red">
                      <i class="fas fa-trash"></i>
                  </button>
              `,
      },
    ],
  });

  // Fetch technician data and populate the table
  function fetchTechniciansData() {
    fetch(`/server/dms_function/admin/techs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Log the data to check its structure
        if (data && Array.isArray(data)) {
          // Check if data is an array and map the technicians correctly
          const techniciansData = data.map((item) => item);

          // Add the data to the table
          table.clear().rows.add(techniciansData).draw();
          $(".baller-container").hide();
        } else {
          console.error("Invalid data format", data);
          swal("Error", "Invalid data format received from server.", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching technician data:", error);
        swal(
          "Error",
          "Failed to load technician data: " + error.message,
          "error"
        );
      });
  }

  // Fetch all dealers and populate the dropdown
  function fetchDealersData() {
    return fetch(`/server/dms_function/admin/dealer/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Log the data to check its structure
        if (data && Array.isArray(data)) {
          // Populate the dealers dropdown
          const dealerDropdown = $("#dealerID");
          dealerDropdown.empty(); // Clear previous options
          dealerDropdown.append('<option value="">Select Dealer</option>'); // Default option

          data.forEach((dealer) => {
            const dealerId = dealer.ROWID;
            const displayText = "DL" + dealerId.slice(-4); // Format Dealer ID
            dealerDropdown.append(
              `<option value="${dealerId}">${displayText}</option>`
            );
          });
        } else {
          console.error("Invalid dealer data format", data);
          swal(
            "Error",
            "Invalid dealer data format received from server.",
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching dealer data:", error);
        swal("Error", "Failed to load dealer data: " + error.message, "error");
      });
  }

  // Fetch the technician and dealer data on page load
  fetchTechniciansData();
  fetchDealersData();

  // Show the technician modal when the button is clicked
  $("#add-technician-btn").on("click", function () {
    $("#technician-modal").modal("show");
  });

  // Handle Save Technician Button Click
  $(".save-technician-btn").on("click", function () {
    const newTechnician = {
      name: $("#technicianName").val(),
      email: $("#email").val(),
      phone: $("#phone").val(),
      specialization: $("#specialization").val(),
      address: $("#address").val(),
      dealer_id: $("#dealerID").val(),
      password: $("#password").val(), // Include password
      role: "Technician",
    };

    if (
      !newTechnician.name ||
      !newTechnician.email ||
      !newTechnician.password
    ) {
      swal("Error", "Please fill in all the required fields.", "error");
      return;
    }

    console.log("data", newTechnician);
    fetch(`/server/dms_function/admin/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(newTechnician),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          swal(
            "Success!",
            "Technician has been added successfully.",
            "success"
          );
          $("#technician-modal").modal("hide");
          fetchTechniciansData(); // Refresh the technician list
        } else {
          swal("Error", "Failed to add technician: " + data.message, "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error adding technician: " + error.message, "error");
      });
  });

  // Handle Edit Button Click
  $("#technicians").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Populate the modal fields with current data
    $("#technicianName").val(rowData.TechnicianName);
    $("#email").val(rowData.Email);
    $("#phone").val(rowData.Phone);
    $("#specialization").val(rowData.specialization);
    $("#address").val(rowData.address);
    $("#dealerID").val(rowData.ROWID);
    $("#password").val(""); // Clear password field on edit

    $("#technician-modal").modal("show");

    $(".save-technician-btn")
      .off("click")
      .on("click", function () {
        const updatedTechnician = {
          TechnicianName: $("#technicianName").val(),
          Email: $("#email").val(),
          Phone: $("#phone").val(),
          specialization: $("#specialization").val(),
          address: $("#address").val(),
          dealer_id: $("#dealerID").val(),
          ROWID: rowData.ROWID,
        };

        fetch(`/server/technicians/update/${rowData.ROWID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer your_token",
          },
          body: JSON.stringify(updatedTechnician),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              swal(
                "Success!",
                "Technician has been updated successfully.",
                "success"
              );
              $("#technician-modal").modal("hide");
              fetchTechniciansData(); // Refresh the technician list
            } else {
              swal(
                "Error",
                "Failed to update technician: " + data.message,
                "error"
              );
            }
          })
          .catch((error) => {
            swal(
              "Error",
              "Error updating technician: " + error.message,
              "error"
            );
          });
      });
  });

  // Handle Delete Button Click
  $("#technicians").on("click", ".delete-technician-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this technician!",
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
          fetch(`/server/technicians/delete/${rowData.ROWID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer your_token",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                swal("Deleted!", "The technician has been deleted.", "success");
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete technician: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting technician: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The technician is safe.", "error");
        }
      }
    );
  });
});
