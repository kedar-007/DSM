(function (l) {
  "use strict";
  $(".baller-container").show();
  $(".content-wrapper").hide();

  function e() {
    this.$body = l("body");
    this.$modal = new bootstrap.Modal(document.getElementById("event-modal"), {
      backdrop: "static",
    });
    this.$calendar = l("#calendar");
    this.$formEvent = l("#form-event");
    this.$btnNewEvent = l("#btn-new-event");
    this.$btnDeleteEvent = l("#btn-delete-event");
    this.$btnSaveEvent = l("#btn-save-event");
    this.$modalTitle = l("#modal-title");
    this.$calendarObj = null;
    this.$selectedEvent = null;
    this.$newEventData = null;
    this.$tableObj = null; // Add reference for DataTable object
  }

  // Fetch appointments from backend using the stored doctor ID
  e.prototype.fetchAppointments = function () {
    var a = this;
    var doctorId = localStorage.getItem("userId"); // Retrieve doctor ID from localStorage

    if (!doctorId) {
      console.error("Doctor ID not found in localStorage");
      return;
    }

    return l.ajax({
      url: `/server/dental_management_function/doctor/${doctorId}/appointments/all`, // API endpoint
      method: "GET",
      success: function (data) {
        $(".baller-container").hide();
        $(".content-wrapper").show();
        // Filter only non-attended appointments for the calendar
        var events = data
          .filter(function (appointment) {
            return appointment.status.toUpperCase() !== "";
          })
          .map(function (appointment) {
            return {
              id: appointment.ROWID, // Use ROWID as the unique identifier
              title:
                appointment.name + " - " + appointment.status.toUpperCase(),
              start: new Date(appointment.date_time),
              className: a.getStatusClass(appointment.status), // Use class based on status
            };
          });

        a.initCalendar(events);

        // Initialize or reload DataTable with the fetched data
        // Initialize or reload DataTable with the fetched data
        if (!a.$tableObj) {
          a.$tableObj = $("#appointments").DataTable({
            data: data, // Initialize with the fetched data
            paging: true,
            lengthChange: true,
            searching: true,
            ordering: true,
            info: true,
            autoWidth: false,
            columns: [
              { data: "name", title: "Patient Name" },
              { data: "date_time", title: "Date" },
              { data: "address", title: "Address" },
              { data: "status", title: "Status" },
              { data: "phone_no", title: "Phone" },
              {
                data: null,
                title: "Actions",
                render: function (data, type, row) {
                  return `
            <button class="btn btn-blue edit-btn" style="color:blue">
              <i class="fas fa-edit"></i> 
            </button>
            <button class="btn btn-red delete-btn" style="color:red">
              <i class="fas fa-trash"></i> 
            </button>`;
                },
              },
            ],
            rowCallback: function (row, data, index) {
              let status = data.status ? data.status.toUpperCase() : "";
              let statusCell = $(row).find("td:eq(3)"); // Target the Status cell specifically

              // Reset background color for the Status cell

              statusCell.css("color", ""); // Reset color first

              // Apply color based on status
              if (status === "PENDING") {
                statusCell.css("color", "#d8810a"); // Warning color
              } else if (status === "CANCELLED") {
                statusCell.css("color", "#f0071c"); // Red color
              } else if (status === "ATTENDED") {
                statusCell.css("color", "#0fa030"); // Green color
              } else if (status === "HIGH PRIORITY") {
                statusCell.css("color", "#102be2"); // Blue color
              } else if (status === "RESCHEDULED") {
                statusCell.css("color", "#0b6ce8"); // Default color for unknown statuses
              }
            },
          });
        } else {
          a.$tableObj.clear().rows.add(data).draw(); // Reload data if DataTable already initialized
        }

        // Handle Edit Button Click
        $("#appointments").on("click", ".edit-btn", function () {
          let row = $(this).closest("tr");
          let rowData = a.$tableObj.row(row).data();

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
        $("#appointments").on("click", ".save-btn", function (e) {
          e.preventDefault();

          // Show the baller loader
          $(".baller-container")
            .css({
              display: "flex", // Display the loader container
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              "z-index": "9999",
              "flex-direction": "row", // Align balls horizontally
              "justify-content": "center", // Center horizontally
              "align-items": "center", // Center vertically
            })
            .show();

          let row = $(this).closest("tr");
          let rowData = a.$tableObj.row(row).data();

          let updatedData = {};
          let rowID = rowData["ROWID"]; // Get Appointment ID

          const columnMapping = {
            "Patient Name": "name",
            Date: "date_time",
            Address: "address",
            Status: "status",
            Phone: "phone_no",
          };

          $(row)
            .find("td:not(:last-child)")
            .each(function () {
              let cell = $(this);
              let input = cell.find("input");
              let originalValue = cell.data("original-value");
              let newValue = input.val();

              if (newValue !== originalValue) {
                let columnName = a.$tableObj
                  .column(cell.index())
                  .header()
                  .textContent.trim();
                let mappedColumnName = columnMapping[columnName];
                if (mappedColumnName) {
                  updatedData[mappedColumnName] = newValue;
                }
              }
            });

          if (Object.keys(updatedData).length > 0) {
            updatedData["ROWID"] = rowID;

            fetch(
              `/server/dental_management_function/admin/appointment/${rowID}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer your_token",
                },
                body: JSON.stringify(updatedData),
              }
            )
              .then((response) => response.json())
              .then((data) => {
                $(".baller-container").hide(); // Hide baller container after response is received

                if (data.MODIFIEDTIME) {
                  // Update the row with the new data
                  let updatedRowData = Object.assign(rowData, updatedData);
                  var rowIndex = a.$tableObj.row(row).index();

                  // Log statements
                  console.log("Row index:", rowIndex);
                  console.log("Updated Row Data:", updatedRowData);
                  console.log(
                    "Data before update:",
                    a.$tableObj.row(row).data()
                  );

                  // Directly update the data in the table
                  a.$tableObj
                    .row(rowIndex)
                    .data(updatedRowData)
                    .invalidate()
                    .draw(false);

                  // Trigger the success alert
                  swal(
                    "Success!",
                    "The appointment has been successfully updated.",
                    "success"
                  );

                  // Revert the row back to its original non-editable state
                  $(row)
                    .find("td:not(:last-child)")
                    .each(function () {
                      let cell = $(this);
                      cell.html(cell.find("input").val());
                    });

                  // Restore the action buttons
                  $(row).find("td:last-child").html(`
                      <button class="btn btn-blue edit-btn">
                          <i class="fas fa-edit"></i> 
                      </button>
                      <button class="btn btn-red delete-btn">
                          <i class="fas fa-trash"></i> 
                      </button>
                  `);
                } else {
                  console.error("Error updating data:", data.message);
                }
              })
              .catch((error) => {
                $(".baller-container").hide(); // Hide baller container in case of error
                console.error("Error:", error);
              });
          } else {
            $(".baller-container").hide(); // Hide baller container if no changes detected
            console.log("No changes detected.");
            a.$tableObj.row(row).data(rowData).draw();

            // Restore the action buttons
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
        $("#appointments").on("click", ".cancel-btn", function () {
          let row = $(this).closest("tr");
          let originalData = a.$tableObj.row(row).data();
          a.$tableObj.row(row).data(originalData).draw();
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
          let row = $(this).closest("tr");
          let rowData = a.$tableObj.row(row).data();
          console.log("Here is the row data", rowData);
          let rowID = rowData["ROWID"]; // Get Appointment ID
          console.log("Especially the rowId", rowID);

          swal(
            {
              title: "Are you sure?",
              text: "You will not be able to recover this appointment!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#fec801",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "No, cancel plx!",
              closeOnConfirm: false,
              closeOnCancel: false,
            },
            function (isConfirm) {
              if (isConfirm) {
                $("#loader").show();

                fetch(
                  `/server/dental_management_function/admin/appointment/${rowID}`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: "Bearer your_token",
                    },
                  }
                )
                  .then((response) => response.json())
                  .then((data) => {
                    console.log("Data is coming from backend", data);
                    $("#loader").hide();

                    if (data.message === "Appointment deleted successfully") {
                      swal(
                        "Deleted!",
                        "Your appointment has been deleted.",
                        "success"
                      );
                      a.$tableObj.row(row).remove().draw();
                    } else {
                      console.error("Error deleting data:", data.message);
                    }
                  })
                  .catch((error) => {
                    $("#loader").hide();
                    console.error("Error:", error);
                  });
              } else {
                swal("Cancelled", "Your appointment is safe :)", "error");
              }
            }
          );
        });
      },
      error: function (error) {
        console.error("Error fetching appointments:", error);
      },
    });
  };

  e.prototype.initCalendar = function (events) {
    var a = this;
    a.$calendarObj = new FullCalendar.Calendar(a.$calendar[0], {
      slotDuration: "00:15:00",
      slotMinTime: "08:00:00",
      slotMaxTime: "19:00:00",
      themeSystem: "bootstrap",
      bootstrapFontAwesome: !1,
      buttonText: {
        today: "Today",
        month: "Month",
        week: "Week",
        day: "Day",
        prev: "Prev",
        next: "Next",
      },
      initialView: "dayGridMonth", // Change this to "timeGridWeek" or "timeGridDay" if needed
      handleWindowResize: !0,
      height: l(window).height() - 200,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay", // Week and Day views added
      },
      events: events, // Use the dynamically fetched events here
      editable: !0,
      droppable: !0,
      selectable: !0,
      dateClick: function (e) {
        a.onSelect(e);
      },
      eventClick: function (e) {
        a.onEventClick(e);
      },
    });
    a.$calendarObj.render();
  };

  e.prototype.onEventClick = function (e) {
    this.$formEvent[0].reset();
    this.$formEvent.removeClass("was-validated");
    this.$selectedEvent = e.event;
    this.$modalTitle.text("Edit Appointment Status");
    this.$modal.show();
    l("#event-title").val(this.$selectedEvent.title.split(" - ")[0]); // Extract only the name
    l("#event-category").val(
      this.$selectedEvent.title.split(" - ")[1].toUpperCase()
    ); // Set the status in the dropdown
  };

  e.prototype.onSelect = function (e) {
    this.$formEvent[0].reset();
    this.$formEvent.removeClass("was-validated");
    this.$selectedEvent = null;
    this.$newEventData = e;
    this.$modalTitle.text("Add New Event");
    this.$modal.show();
    this.$calendarObj.unselect();
  };

  e.prototype.init = function () {
    var a = this;
    a.fetchAppointments(); // Fetch and initialize calendar with appointments
    a.$btnNewEvent.on("click", function (e) {
      a.onSelect({ date: new Date(), allDay: !0 });
    });
    a.$formEvent.on("submit", function (e) {
      e.preventDefault();
      var t,
        n = a.$formEvent[0];
      n.checkValidity()
        ? (a.$selectedEvent
            ? (a.updateAppointmentStatus(
                a.$selectedEvent.id, // Ensure ROWID is passed
                l("#event-category option:selected").text().toUpperCase()
              ),
              a.$selectedEvent.setProp(
                "title",
                l("#event-title").val() +
                  " - " +
                  l("#event-category option:selected").text().toUpperCase()
              ),
              a.$selectedEvent.setProp("classNames", [
                a.getStatusClass(
                  l("#event-category option:selected").text().toUpperCase()
                ),
              ]))
            : ((t = {
                title: l("#event-title").val(),
                start: a.$newEventData.date,
                allDay: a.$newEventData.allDay,
                className: a.getStatusClass(
                  l("#event-category option:selected").text().toUpperCase()
                ),
              }),
              a.$calendarObj.addEvent(t)),
          a.$modal.hide())
        : (e.stopPropagation(), n.classList.add("was-validated"));
    });
    l(
      a.$btnDeleteEvent.on("click", function (e) {
        a.$selectedEvent &&
          (a.$selectedEvent.remove(),
          (a.$selectedEvent = null),
          a.$modal.hide());
      })
    );

    // Handle View Toggle
    l("#btn-toggle-view").on("click", function () {
      var calendarContainer = l("#calendar-container");
      var listContainer = l("#list-container");
      if (calendarContainer.is(":visible")) {
        calendarContainer.hide();
        listContainer.show();
        l(this).text("Calendar View");
      } else {
        listContainer.hide();
        calendarContainer.show();
        l(this).text("List View");
      }
    });
  };

  e.prototype.getStatusClass = function (status) {
    switch (status.toUpperCase()) {
      case "ATTENDED":
        return "bg-success";
      case "HIGH PRIORITY":
        return "bg-info";
      case "PENDING":
        return "bg-warning";
      case "CANCELLED":
        return "bg-danger";
      // Add other status cases here
      default:
        return "bg-info";
    }
  };

  e.prototype.updateAppointmentStatus = function (appointmentId, status) {
    console.log("Status in the function", status);
    console.log("Appointment id  in the function", appointmentId);
    var doctorId = localStorage.getItem("userId");

    if (!doctorId || !appointmentId) {
      console.error("Missing doctor ID or appointment ID");
      return;
    }

    l.ajax({
      url: `/server/dental_management_function/doctor/appointment/${appointmentId}`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ status: status }), // Pass the status text (e.g., "Attended", "Cancelled")
      success: function (response) {
        console.log("Appointment status updated", response);
        window.jQuery.CalendarApp.fetchAppointments(); // Refresh data after update
      },
      error: function (error) {
        console.error("Error updating appointment status:", error);
      },
    });
  };

  // init
  l.CalendarApp = new e();
  l.CalendarApp.init();
})(window.jQuery);
