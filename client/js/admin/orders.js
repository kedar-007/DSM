$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  // Fetch product names and dealers from the backend to map against their IDs
  let productMap = {};

  // Fetch products from the backend
  fetch(`/server/dms_function/admin/products`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your_token",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Assuming the data is an array of products with ROWID and ProductName
      data.forEach((product) => {
        productMap[product.ROWID] = {
          name: product.ProductName,
          price: parseFloat(product.Price), // Assuming price is available in the product data
        };
        $("#productSelect").append(`
          <div class="form-check">
            <input class="form-check-input product-checkbox" type="checkbox" value="${product.ROWID}" data-price="${product.Price}" id="product-${product.ROWID}">
            <label class="form-check-label" for="product-${product.ROWID}">
              ${product.ProductName} - $${product.Price}
            </label>
          </div>
        `);
      });

      // After loading products, fetch the dealers
      fetchDealersData();
    })
    .catch((error) => {
      console.error("Error fetching product data:", error);
      $(".baller-container").hide(); // Hide the loader in case of error
      swal("Error", "Failed to load product data: " + error.message, "error");
    });

  // Fetch dealers from the backend
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
        data.forEach((dealer) => {
          const dealerCode = `DL${dealer.ROWID.slice(-4)}`;
          $("#dealerId").append(
            `<option value="${dealer.ROWID}">${dealer.DealerName} (${dealerCode})</option>`
          );
        });

        // After loading dealers, fetch the orders
        fetchOrdersData();
      })
      .catch((error) => {
        console.error("Error fetching dealer data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        swal("Error", "Failed to load dealer data: " + error.message, "error");
      });
  }

  // Initialize DataTable for the list of orders
  let table = $("#orders").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Order ID", data: "OrderID" },
      { title: "Dealer ID", data: "DealerID" },
      { title: "Total Amount", data: "TotalAmount" },
      { title: "Date", data: "OrderDate" },
      { title: "Status", data: "OrderStatus" },
      { title: "Products", data: "Products" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm delete-medicine-btn" style="color:red">
            <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
    createdRow: function (row, data, dataIndex) {
      // Apply color based on the status
      if (data.OrderStatus === "Pending") {
        $("td:eq(4)", row).css("color", "red");
      } else if (data.OrderStatus === "Completed") {
        $("td:eq(4)", row).css("color", "green");
      } else if (data.OrderStatus === "Cancelled") {
        $("td:eq(4)", row).css("color", "blue");
      }
    },
  });

  // Function to fetch orders data and populate the table
  function fetchOrdersData() {
    fetch(`/server/dms_function/admin/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Process and map the data
        const ordersData = data.map((order) => {
          // Extract last four digits for Order ID and Dealer ID
          const orderID = `ORD${order.ROWID.slice(-4)}`;
          const dealerID = `DL${order.DealerID.slice(-4)}`;

          // Ensure Products is correctly parsed
          let products;
          try {
            products = Array.isArray(order.Products)
              ? order.Products
              : JSON.parse(order.Products);
            if (!Array.isArray(products)) {
              products = [];
            }
          } catch {
            products = [];
          }

          // Convert product IDs to product names
          const productNames = products
            .map((id) => productMap[id]?.name || id)
            .join(", ");

          return {
            OrderID: orderID,
            DealerID: dealerID,
            TotalAmount: order.TotalAmount,
            OrderDate: order.OrderDate,
            OrderStatus: order.OrderStatus,
            Products: productNames,
            ROWID: order.ROWID, // Keep ROWID for edit/delete actions
          };
        });

        // Add the data to the table
        table.clear().rows.add(ordersData).draw();
        $(".content-wrapper").show(); // Show the content wrapper
        $(".baller-container").hide(); // Hide the loader
      })
      .catch((error) => {
        console.error("Error fetching orders data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        $(".content-wrapper").hide(); // Hide the content wrapper in case of error
        swal("Error", "Failed to load orders data: " + error.message, "error");
      });
  }

  // Calculate total amount when products are selected
  $("#productSelect").on("change", ".product-checkbox", function () {
    let totalAmount = 0;
    $("#productSelect .product-checkbox:checked").each(function () {
      totalAmount += parseFloat($(this).data("price"));
    });
    $("#totalAmount").val(totalAmount.toFixed(2));
  });

  // Handle Order Creation
  $("#add-order-btn").on("click", function () {
    $("#order-modal").modal("show");
  });

  // Handle Save Order Button Click
  $(".save-order-btn").on("click", function () {
    const dealerId = $("#dealerId").val();
    let orderDate = $("#orderDate").val();
    const orderStatus = $("#orderStatus").val();
    const totalAmount = $("#totalAmount").val();
    const selectedProducts = [];

    $("#productSelect .product-checkbox:checked").each(function () {
      selectedProducts.push($(this).val());
    });

    if (!dealerId || !orderDate || selectedProducts.length === 0) {
      swal("Error", "Please fill all required fields.", "error");
      return;
    }

    // Format order date to "YYYY-MM-DD HH:MM:SS"
    const date = new Date(orderDate);
    const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");

    const orderData = {
      DealerID: dealerId,
      OrderDate: formattedDate,
      TotalAmount: totalAmount,
      OrderStatus: orderStatus,
      Products: selectedProducts,
    };

    fetch(`/server/dms_function/admin/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(orderData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          swal("Success!", "Order has been created successfully.", "success");
          $("#order-modal").modal("hide");
          fetchOrdersData(); // Refresh the order list
        } else {
          swal("Error", "Failed to create order: " + data.message, "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error creating order: " + error.message, "error");
      });
  });

  // Handle Edit Button Click
  $("#orders").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Open the edit modal and populate fields
    $("#editOrderStatus").val(rowData.OrderStatus);
    $("#edit-order-modal").data("rowId", rowData.ROWID).modal("show");
  });

  // Handle Save Edit Order Button Click
  $(".save-edit-order-btn").on("click", function () {
    const rowID = $("#edit-order-modal").data("rowId");
    const orderStatus = $("#editOrderStatus").val();

    // Create the update data object
    const updateData = {
      OrderStatus: orderStatus,
    };

    fetch(`/server/dms_function/admin/order/${rowID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data", data);
        if (data.MODIFIEDTIME) {
          swal(
            "Success!",
            "Order status has been updated successfully.",
            "success"
          );
          $("#edit-order-modal").modal("hide");
          fetchOrdersData(); // Refresh the order list
        } else {
          swal("Error", "Failed to update order: " + data.message, "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error updating order: " + error.message, "error");
      });
  });

  // Handle Delete Button Click
  $("#orders").on("click", ".delete-medicine-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this order's record!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#fec801",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: false,
        closeOnCancel: false,
      },
      function (isConfirm) {
        console.log("ROWID", rowID);
        if (isConfirm) {
          fetch(`/server/dms_function/admin/order/${rowID}`, {
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
                  "The order record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete order record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting order record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The order record is safe.", "error");
        }
      }
    );
  });
});
