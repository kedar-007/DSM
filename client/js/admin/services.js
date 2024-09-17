$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  let productsMap = {}; // To map product IDs to product names

  // Initialize DataTable for the list of service requests
  let table = $("#service-requests").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      {
        title: "Request ID",
        data: "ROWID",
        render: function (data, type, row) {
          return "RQ" + data.slice(-4); // Show last 4 digits prefixed with RQ
        },
      },
      { title: "Request Date", data: "RequestDate" },
      { title: "Description", data: "Description" },
      { title: "Status", data: "Status" },
      {
        title: "Technician ID",
        data: "TechnicianID",
        render: function (data, type, row) {
          return "TL" + data.slice(-4); // Show last 4 digits prefixed with TL
        },
      },
      {
        title: "Dealer ID",
        data: "DealerID",
        render: function (data, type, row) {
          return "DL" + data.slice(-4); // Show last 4 digits prefixed with DL
        },
      },
      {
        title: "Product",
        data: "ProductID",
        render: function (data, type, row) {
          return productsMap[data] || "Unknown"; // Show product name
        },
      },
      {
        title: "Actions",
        data: null,
        defaultContent: `
                  <button class="btn btn-sm edit-btn" style="color:blue">
                      <i class="fas fa-edit"></i> 
                  </button>
                  <button class="btn btn-sm delete-service-request-btn" style="color:red">
                      <i class="fas fa-trash"></i>
                  </button>
              `,
      },
    ],
  });

  // Function to format date to 'YYYY-MM-DD HH:MM:SS'
  function formatDateToString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ("0" + (d.getMonth() + 1)).slice(-2); // Add leading zero
    const day = ("0" + d.getDate()).slice(-2); // Add leading zero
    const hours = ("0" + d.getHours()).slice(-2);
    const minutes = ("0" + d.getMinutes()).slice(-2);
    const seconds = ("0" + d.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Fetch service request data and populate the table
  function fetchServiceRequestsData() {
    fetch(`/server/dms_function/admin/ServiceRequests`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Process and map the data
        const serviceRequestsData = data.map((item) => {
          return {
            RequestDate: item ? item.RequestDate : "",
            Description: item ? item.Description : "",
            Status: item ? item.Status : "",
            TechnicianID: item ? item.TechnicianID : "",
            DealerID: item ? item.DealerID : "",
            ProductID: item ? item.ProductID : "",
            ROWID: item ? item.ROWID : "", // Keep ROWID for edit/delete actions
          };
        });

        // Add the data to the table
        table.clear().rows.add(serviceRequestsData).draw();
        $(".content-wrapper").show(); // Show the content wrapper
        $(".baller-container").hide(); // Hide the loader
      })
      .catch((error) => {
        console.error("Error fetching service requests data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        $(".content-wrapper").hide(); // Hide the content wrapper in case of error
        swal(
          "Error",
          "Failed to load service requests data: " + error.message,
          "error"
        );
      });
  }

  // Function to populate dropdowns with Dealers, Products, and Technicians
  function populateDropdowns() {
    // Fetch Dealers
    fetch("/server/dms_function/admin/dealer/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        let dealerOptions = data.map(
          (dealer) =>
            `<option value="${dealer.ROWID}">DL${dealer.ROWID.slice(-4)} - ${
              dealer.DealerName
            }</option>`
        );
        $("#dealerID").html(dealerOptions.join(""));
      })
      .catch((error) => console.error("Error fetching dealers:", error));

    // Fetch Products
    fetch("/server/dms_function/admin/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Create a map of product IDs to names
        productsMap = data.reduce((map, product) => {
          map[product.ROWID] = product.ProductName;
          return map;
        }, {});

        let productOptions = data.map(
          (product) =>
            `<option value="${product.ROWID}">${product.ProductName}</option>`
        );
        $("#productID").html(productOptions.join(""));
      })
      .catch((error) => console.error("Error fetching products:", error));

    // Fetch Technicians
    fetch("/server/dms_function/admin/techs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        let technicianOptions = data.map(
          (tech) =>
            `<option value="${tech.ROWID}">TL${tech.ROWID.slice(-4)} - ${
              tech.TechnicianName
            }</option>`
        );
        $("#technicianID").html(technicianOptions.join(""));
      })
      .catch((error) => console.error("Error fetching technicians:", error));
  }

  // Fetch the service requests data on page load
  fetchServiceRequestsData();

  // Show the service request modal when the button is clicked
  $("#add-service-request-btn").on("click", function () {
    populateDropdowns(); // Populate dropdowns before showing modal
    $("#service-request-modal").modal("show");
  });

  // Handle Save Service Request Button Click
  $(".save-service-request-btn").on("click", function () {
    const rawDate = $("#requestDate").val();
    const formattedDate = formatDateToString(rawDate); // Format the date
    const newServiceRequest = {
      RequestDate: formattedDate,
      TechnicianID: $("#technicianID").val(),
      DealerID: $("#dealerID").val(),
      ProductID: $("#productID").val(),
      Description: $("#serviceDescription").val(),
      Status: $("#status").val(),
    };

    if (!newServiceRequest.RequestDate || !newServiceRequest.Description) {
      swal("Error", "Please fill in all the required fields.", "error");
      return;
    }
    console.log(newServiceRequest);
    fetch(`/server/dms_function/admin/request/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(newServiceRequest),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          swal(
            "Success!",
            "Service request has been created successfully.",
            "success"
          );
          $("#service-request-modal").modal("hide");
          fetchServiceRequestsData(); // Refresh the service requests list
        } else {
          swal(
            "Error",
            "Failed to create service request: " + data.message,
            "error"
          );
        }
      })
      .catch((error) => {
        swal(
          "Error",
          "Error creating service request: " + error.message,
          "error"
        );
      });
  });

  // Handle Edit Button Click
  $("#service-requests").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    populateDropdowns(); // Populate dropdowns before showing modal

    // Populate the modal fields with current data
    $("#requestDate").val(rowData.RequestDate);
    $("#technicianID").val(rowData.TechnicianID);
    $("#dealerID").val(rowData.DealerID);
    $("#productID").val(rowData.ProductID);
    $("#serviceDescription").val(rowData.Description);
    $("#status").val(rowData.Status);

    $("#service-request-modal").modal("show");

    $(".save-service-request-btn")
      .off("click")
      .on("click", function () {
        const rawDate = $("#requestDate").val();
        const formattedDate = formatDateToString(rawDate); // Format the date
        const updatedServiceRequest = {
          RequestDate: formattedDate,
          TechnicianID: $("#technicianID").val(),
          DealerID: $("#dealerID").val(),
          ProductID: $("#productID").val(),
          Description: $("#serviceDescription").val(),
          Status: $("#status").val(),
          ROWID: rowData.ROWID,
        };

        fetch(`/server/service_request/update/${rowData.ROWID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer your_token",
          },
          body: JSON.stringify(updatedServiceRequest),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              swal(
                "Success!",
                "Service request has been updated successfully.",
                "success"
              );
              $("#service-request-modal").modal("hide");
              fetchServiceRequestsData(); // Refresh the service requests list
            } else {
              swal(
                "Error",
                "Failed to update service request: " + data.message,
                "error"
              );
            }
          })
          .catch((error) => {
            swal(
              "Error",
              "Error updating service request: " + error.message,
              "error"
            );
          });
      });
  });

  // Handle Delete Button Click
  $("#service-requests").on(
    "click",
    ".delete-service-request-btn",
    function () {
      let row = $(this).closest("tr");
      let rowData = table.row(row).data();

      swal(
        {
          title: "Are you sure?",
          text: "You will not be able to recover this service request!",
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
            fetch(`/server/service_request/delete/${rowData.ROWID}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer your_token",
              },
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  swal(
                    "Deleted!",
                    "The service request has been deleted.",
                    "success"
                  );
                  table.row(row).remove().draw();
                } else {
                  swal(
                    "Error",
                    "Failed to delete service request: " + data.message,
                    "error"
                  );
                }
              })
              .catch((error) => {
                swal(
                  "Error",
                  "Error deleting service request: " + error.message,
                  "error"
                );
              });
          } else {
            swal("Cancelled", "The service request is safe.", "error");
          }
        }
      );
    }
  );
});
