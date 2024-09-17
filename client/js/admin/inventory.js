$(document).ready(function () {
  let productsMap = {}; // To map product IDs to product names

  // Initialize DataTable for the list of inventory items
  let table = $("#inventory").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      {
        title: "Product Name",
        data: "ProductID",
        render: function (data, type, row) {
          return productsMap[data] || "Unknown"; // Show product name
        },
      },
      { title: "Stock Quantity", data: "StockQuantity" },
      {
        title: "Dealer ID",
        data: "DealerID",
        render: function (data, type, row) {
          return "DL" + data.slice(-4); // Show last 4 digits prefixed with DL
        },
      },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm edit-btn" style="color:blue">
              <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm delete-inventory-btn" style="color:red">
              <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
  });

  // Fetch inventory data and populate the table
  function fetchInventoryData() {
    fetch(`/server/dms_function/admin/dealers/inverntory`, {
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
        $(".baller-container").hide();
      })
      .catch((error) => {
        console.error("Error fetching inventory data:", error);
        swal(
          "Error",
          "Failed to load inventory data: " + error.message,
          "error"
        );
      });
  }

  // Fetch product data to map Product IDs to Product Names
  function fetchProductsData() {
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

        // Fetch inventory data only after product data is fetched
        fetchInventoryData();
      })
      .catch((error) => console.error("Error fetching products:", error));
  }

  // Fetch the product and inventory data on page load
  fetchProductsData();

  // Show the inventory modal when the button is clicked
  $("#add-inventory-btn").on("click", function () {
    $("#inventory-modal").modal("show");
  });

  // Handle Save Inventory Button Click
  $(".save-inventory-btn").on("click", function () {
    const newInventory = {
      ProductID: $("#productId").val(),
      StockQuantity: $("#stockQuantity").val(),
      DealerID: $("#dealerId").val(),
    };

    if (
      !newInventory.ProductID ||
      !newInventory.StockQuantity ||
      !newInventory.DealerID
    ) {
      swal("Error", "Please fill in all the required fields.", "error");
      return;
    }

    fetch(`/server/inventory/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(newInventory),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          swal("Success!", "Inventory has been added successfully.", "success");
          $("#inventory-modal").modal("hide");
          fetchInventoryData(); // Refresh the inventory list
        } else {
          swal("Error", "Failed to add inventory: " + data.message, "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error adding inventory: " + error.message, "error");
      });
  });

  // Handle Edit Button Click
  $("#inventory").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Populate the modal fields with current data
    $("#productId").val(rowData.ProductID);
    $("#stockQuantity").val(rowData.StockQuantity);
    $("#dealerId").val(rowData.DealerID);

    $("#inventory-modal").modal("show");

    $(".save-inventory-btn")
      .off("click")
      .on("click", function () {
        const updatedInventory = {
          ProductID: $("#productId").val(),
          StockQuantity: $("#stockQuantity").val(),
          DealerID: $("#dealerId").val(),
          ROWID: rowData.ROWID,
        };

        fetch(`/server/inventory/update/${rowData.ROWID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer your_token",
          },
          body: JSON.stringify(updatedInventory),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              swal(
                "Success!",
                "Inventory has been updated successfully.",
                "success"
              );
              $("#inventory-modal").modal("hide");
              fetchInventoryData(); // Refresh the inventory list
            } else {
              swal(
                "Error",
                "Failed to update inventory: " + data.message,
                "error"
              );
            }
          })
          .catch((error) => {
            swal(
              "Error",
              "Error updating inventory: " + error.message,
              "error"
            );
          });
      });
  });

  // Handle Delete Button Click
  $("#inventory").on("click", ".delete-inventory-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this inventory item!",
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
          fetch(`/server/inventory/delete/${rowData.ROWID}`, {
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
                  "The inventory item has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete inventory: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting inventory: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The inventory item is safe.", "error");
        }
      }
    );
  });
});
