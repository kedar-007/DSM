$(document).ready(function () {
  // Hide the table and content wrapper initially
  $(".content-wrapper").hide();

  // Ensure the loader (baller-container) is visible initially
  $(".baller-container").show();

  // Initialize DataTable for the list of spare parts
  let table = $("#spareParts").DataTable({
    data: [], // Initialize with empty data
    paging: true,
    lengthChange: true,
    searching: true,
    ordering: true,
    info: true,
    autoWidth: false,
    columns: [
      { title: "Spare Part ID", data: "SparePartID" },
      { title: "Part Name", data: "PartName" },
      { title: "Description", data: "Description" },
      { title: "Cost", data: "Cost" },
      {
        title: "Actions",
        data: null,
        defaultContent: `
          <button class="btn btn-sm edit-btn" style="color:blue">
            <i class="fas fa-edit"></i> 
          </button>
          <button class="btn btn-sm delete-spare-part-btn" style="color:red">
            <i class="fas fa-trash"></i>
          </button>
        `,
      },
    ],
  });

  // Fetch spare parts data and populate the table
  function fetchSparePartsData() {
    fetch(`/server/dms_function/technician/spareParts/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_token",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Process and map the data
        const sparePartsData = data.map((part) => {
          const sparePartID = `SP${part.ROWID.slice(-4)}`; // Extract last four digits for Spare Part ID
          return {
            SparePartID: sparePartID,
            PartName: part.PartName,
            Description: part.Description,
            Cost: `$${part.Cost}`,
            ROWID: part.ROWID, // Keep ROWID for edit/delete actions
          };
        });

        // Add the data to the table
        table.clear().rows.add(sparePartsData).draw();
        $(".content-wrapper").show(); // Show the content wrapper
        $(".baller-container").hide(); // Hide the loader
      })
      .catch((error) => {
        console.error("Error fetching spare parts data:", error);
        $(".baller-container").hide(); // Hide the loader in case of error
        $(".content-wrapper").hide(); // Hide the content wrapper in case of error
        swal(
          "Error",
          "Failed to load spare parts data: " + error.message,
          "error"
        );
      });
  }

  // Fetch the spare parts data on page load
  fetchSparePartsData();

  // Handle Edit Button Click
  $("#spareParts").on("click", ".edit-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();

    // Open the edit modal and populate fields (Edit modal code should be implemented if required)
    console.log("Edit part:", rowData);
  });

  // Handle Delete Button Click
  $("#spareParts").on("click", ".delete-spare-part-btn", function () {
    let row = $(this).closest("tr");
    let rowData = table.row(row).data();
    let rowID = rowData["ROWID"];

    swal(
      {
        title: "Are you sure?",
        text: "You will not be able to recover this spare part's record!",
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
          fetch(`/server/dms_function/admin/sparePart/${rowID}`, {
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
                  "The spare part record has been deleted.",
                  "success"
                );
                table.row(row).remove().draw();
              } else {
                swal(
                  "Error",
                  "Failed to delete spare part record: " + data.message,
                  "error"
                );
              }
            })
            .catch((error) => {
              swal(
                "Error",
                "Error deleting spare part record: " + error.message,
                "error"
              );
            });
        } else {
          swal("Cancelled", "The spare part record is safe.", "error");
        }
      }
    );
  });
});
