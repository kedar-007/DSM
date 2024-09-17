$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  // Initialize DataTable for the list of products
  let table = $("#products").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Product Name", data: "ProductName" },
      { title: "Category", data: "Category" },
      { title: "Price", data: "Price" },
      { title: "Description", data: "Description" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm delete-product-btn" style="color:red">
            <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
  });

  // Fetch products data and populate the table
  function fetchProductsData() {
    fetch(`/server/dms_function/admin/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Process and map the data
        const productsData = data.map((product) => {
          return {
            ProductName: product.ProductName,
            Category: product.Category,
            Price: product.Price,
            Description: product.Description,
            ROWID: product.ROWID, // Keep ROWID for edit/delete actions
          };
        });

        // Add the data to the table
        table.clear().rows.add(productsData).draw();
        $(".content-wrapper").show(); // Show the content wrapper
        $(".baller-container").hide(); // Hide the loader
      })
      .catch((error) => {
        console.error("Error fetching products data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        $(".content-wrapper").hide(); // Hide the content wrapper in case of error
        swal(
          "Error",
          "Failed to load products data: " + error.message,
          "error"
        );
      });
  }

  // Fetch the products data on page load
  fetchProductsData();

  // Array to store products before uploading
  let productList = [];

  // Show the product modal when the button is clicked
  $("#add-product-btn").on("click", function () {
    $("#product-modal").modal("show");
  });

  // Add another product to the list
  $("#add-another-product").on("click", function () {
    const newProduct = {
      ProductName: $("#productName").val(),
      Category: $("#category").val(),
      Price: $("#price").val(),
      Description: $("#productDescription").val(),
    };

    if (!newProduct.ProductName || !newProduct.Price) {
      swal("Error", "Please fill in all the fields.", "error");
      return;
    }

    // Add new product to list and display it in the table
    productList.push(newProduct);
    appendProductToTable(newProduct);

    // Reset the fields for a new entry
    $("#productName").val("");
    $("#price").val("");
    $("#productDescription").val("");

    swal("Info", "Product added to the list. Add more if needed.", "info");
  });

  // Append product to the modal table with remove buttons
  function appendProductToTable(product) {
    const tableBody = $("#product-table tbody");
    const rowIndex = tableBody.children().length; // Current row index

    const row = `<tr data-index="${rowIndex}">
                  <td>${product.ProductName}</td>
                  <td>${product.Category}</td>
                  <td>${product.Price}</td>
                  <td>${product.Description}</td>
                  <td>
                    <button class="btn btn-sm btn-danger remove-product-btn">Remove</button>
                  </td>
                </tr>`;

    tableBody.append(row);
    attachRemoveEvent(); // Attach events to new rows
  }

  // Attach remove event to remove buttons in the modal table
  function attachRemoveEvent() {
    $(".remove-product-btn")
      .off("click")
      .on("click", function () {
        const row = $(this).closest("tr");
        const productName = row.find("td:first").text();
        productList = productList.filter((p) => p.ProductName !== productName);
        row.remove();
      });
  }

  // Handle Excel/CSV Upload (Limit to 200 records)
  $("#excel-upload").on("change", function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (sheet.length > 200) {
        swal(
          "Error",
          "The file contains more than 200 records. Please upload a smaller file.",
          "error"
        );
        return;
      }

      // Add each product from the Excel file to the list and table
      sheet.forEach((row) => {
        const newProduct = {
          ProductName: row["ProductName"],
          Category: row["Category"],
          Price: row["Price"],
          Description: row["Description"],
        };
        productList.push(newProduct);
        appendProductToTable(newProduct); // Add to the temporary table
      });

      swal(
        "Success!",
        "Products from Excel have been added to the list.",
        "success"
      );
    };

    reader.readAsArrayBuffer(file);
  });

  // Handle Save Product Button Click in Modal (Save all added products)
  $(".save-product-btn").on("click", function () {
    if (productList.length === 0) {
      swal("Error", "Please add at least one product.", "error");
      return;
    }

    console.log(productList);
    fetch(`/server/dms_function/admin/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
      body: JSON.stringify(productList),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        if (data.success) {
          // Add products to the DataTable directly
          productList.forEach((product) => table.row.add(product).draw(false));

          // Reset form fields and modal
          $("#productName").val("");
          $("#price").val("");
          $("#productDescription").val("");
          $("#product-modal").modal("hide");
          $("#product-table tbody").empty(); // Clear the manual list
          productList = []; // Reset the product list

          swal(
            "Success!",
            "Products have been successfully uploaded.",
            "success"
          );
        } else {
          swal("Error", "Failed to upload products.", "error");
        }
      })
      .catch((error) => {
        swal("Error", "Error uploading products: " + error.message, "error");
      });
  });

  // Handle Remove File Button Click
  $("#remove-file").on("click", function () {
    $("#excel-upload").val(""); // Clear file input
    $("#product-table tbody").empty(); // Clear table
    productList = []; // Reset the product list
    $(this).hide(); // Hide remove button
  });

  // Handle Delete Button Click in DataTable
  $("#products").on("click", ".delete-product-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this product's record!",
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
          fetch(`/server/dms_function/admin/product/${rowID}`, {
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
                  "The product record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete product record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting product record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The product record is safe.", "error");
        }
      }
    );
  });
});
