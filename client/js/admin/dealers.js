$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  // Initialize DataTable for the list of dealers
  let table = $("#dealers").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Dealer ID", data: "DealerID" },
      { title: "Dealer Name", data: "DealerName" },
      { title: "Email", data: "Email" },
      { title: "Phone", data: "Phone" },
      { title: "Address", data: "Address" },
      { title: "City", data: "City" },
      { title: "State", data: "State" },
      { title: "Postal Code", data: "PostalCode" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm delete-dealer-btn" style="color:red">
            <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
  });

  // Fetch dealers data and populate the table
  function fetchDealersData() {
    fetch(`/server/dms_function/admin/dealer/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Process and map the data
        const dealersData = data.map((item) => {
          console.log(item);
          const dealer = item || {}; // Safely access Dealers
          return {
            DealerID: dealer.ROWID ? "DL" + dealer.ROWID.slice(-4) : "N/A",
            DealerName: dealer.DealerName || "N/A",
            Email: dealer.Email || "N/A",
            Phone: dealer.Phone || "N/A",
            Address: dealer.Address || "N/A",
            City: dealer.City || "N/A",
            State: dealer.State || "N/A",
            PostalCode: dealer.PostalCode || "N/A",
            ROWID: dealer.ROWID || "", // Keep ROWID for edit/delete actions
          };
        });

        // Add the data to the table
        table.clear().rows.add(dealersData).draw();
        $(".content-wrapper").show(); // Show the content wrapper
        $(".baller-container").hide(); // Hide the loader
      })
      .catch((error) => {
        console.error("Error fetching dealers data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        $(".content-wrapper").hide(); // Hide the content wrapper in case of error
        swal("Error", "Failed to load dealers data: " + error.message, "error");
      });
  }

  // Fetch the dealers data on page load
  fetchDealersData();

  // Handle Add Dealer Button Click
  $("#add-dealer-btn").on("click", function () {
    $("#dealer-modal").modal("show");
  });

  // Handle Save Dealer Button Click in Modal
  $(".save-dealer-btn").on("click", function () {
    const newDealer = {
      name: $("#dealerName").val(),
      email: $("#email").val(),
      phone: $("#phone").val(),
      password: $("#password").val(),
      address: $("#address").val(),
      city: $("#city").val(),
      state: $("#state").val(),
      PostalCode: $("#postalCode").val(),
      role: "Dealer",
    };

    if (!newDealer.name || !newDealer.email || !newDealer.password) {
      swal("Error", "Please fill in all the required fields.", "error");
      return;
    }

    console.log(newDealer);

    fetch(`/server/dms_function/admin/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(newDealer),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          swal("Success!", "Dealer has been successfully added.", "success");
          $("#dealer-modal").modal("hide");
          fetchDealersData(); // Refresh the dealer list
        } else {
          swal("Error", "Failed to add dealer.", "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error adding dealer: " + error.message, "error");
      });
  });

  // Handle Delete Button Click
  $("#dealers").on("click", ".delete-dealer-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this dealer's record!",
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
          fetch(`/server/dms_function/admin/dealer/${rowID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer your_token",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success === true) {
                swal(
                  "Deleted!",
                  "The dealer record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete dealer record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting dealer record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The dealer record is safe.", "error");
        }
      }
    );
  });
});
