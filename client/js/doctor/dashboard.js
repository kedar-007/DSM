//fetching the doctor id from local storage
var doctorId = localStorage.getItem("userId");
$(function () {
  "use strict";
  $(".baller-container").show();
  $(".content-wrapper").hide();

  // Retrieve user name from local storage and display it
  var userName = localStorage.getItem("userName");
  if (userName) {
    $("#userName").html("Hello,<br>" + userName);
  }

  // Function to fetch count data from the API
  function fetchCount(url) {
    return $.ajax({
      url: url,
      method: "GET",
      dataType: "json",
    });
  }

  // Function to fetch doctor data from the API
  // Example API URLs (replace with actual URLs)
  var apiEndpoints = {
    patients: `/server/dental_management_function/doctor/${doctorId}/patients/all`, // API to get the count of patients
    appointments: `/server/dental_management_function/doctor/${doctorId}/appointments/all`, // API to get the count of appointments
    treatements: `/server/dental_management_function/doctor/${userName}/treatements/all`, // API to get the count of treatments
  };

  // Function to process and count data per month
  function processMonthlyData(data, dateField) {
    const monthlyCounts = {};

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`; // Format: YYYY-MM

      if (!monthlyCounts[yearMonth]) {
        monthlyCounts[yearMonth] = 0;
      }
      monthlyCounts[yearMonth]++;
    });

    // Convert monthlyCounts to arrays for chart
    const categories = Object.keys(monthlyCounts).sort(); // Sort to ensure chronological order
    const counts = categories.map((month) => monthlyCounts[month]);

    return { categories, counts };
  }

  // Function to display top 10 appointments in a table
  function displayTopAppointments(appointments) {
    const sortedAppointments = appointments
      .sort((a, b) => new Date(b.date_time) - new Date(a.date_time)) // Sort by date descending
      .slice(0, 10); // Take top 10

    const appointmentTableBody = $("#appointments-table-body");
    appointmentTableBody.empty(); // Clear existing content

    sortedAppointments.forEach((appointment, index) => {
      let status = appointment.status;
      let statusColor;

      if (appointment.status.toUpperCase() === "PENDING") {
        statusColor = "red";
      } else if (appointment.status.toUpperCase() === "CONVERTED TO PATIENT") {
        statusColor = "green";
      } else {
        statusColor = "gray";
      }

      const appointmentRow = `
      <tr>
        <td>${index + 1}</td> <!-- No. -->
        <td>${appointment.name}</td> <!-- Name -->
        <td>${new Date(
          appointment.date_time
        ).toLocaleString()}</td> <!-- Date & Time -->
        <td>${appointment.address || "N/A"}</td> <!-- Address -->
        <td>${appointment.gender || "N/A"}</td> <!-- Gender -->
        <td style="color: ${statusColor}; text-transform:;">
          ${status}
        </td> <!-- Status -->
      </tr>
    `;
      appointmentTableBody.append(appointmentRow);
    });
  }

  // Function to count the occurrences of each treatment type
  function processTreatmentData(treatmentData) {
    const treatmentCounts = {};

    treatmentData.forEach((item) => {
      if (item.treatement_details) {
        const treatmentType = item.treatement_details.split(",")[0]; // Extract first string before the comma
        if (!treatmentCounts[treatmentType]) {
          treatmentCounts[treatmentType] = 0;
        }
        treatmentCounts[treatmentType]++;
      }
    });

    return treatmentCounts;
  }

  // Function to initialize the donut chart with treatment data
  function initDonutChart(treatmentCounts) {
    const treatmentTypes = Object.keys(treatmentCounts);
    const treatmentValues = Object.values(treatmentCounts);

    var options = {
      series: treatmentValues, // Dynamic data from treatmentCounts
      chart: {
        type: "donut",
        height: 350,
      },
      colors: ["#3246D3", "#00D0FF", "#ee3158", "#ffa800", "#1dbfc1"],
      legend: {
        position: "bottom",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "45%",
          },
        },
      },
      labels: treatmentTypes, // Dynamic labels from treatmentCounts
    };

    var chart = new ApexCharts(
      document.getElementById("donut-chart-example"),
      options
    );
    chart.render();
  }

  // Asynchronous function to fetch data and update DOM and chart
  async function updateData() {
    try {
      console.log("Fetching data from APIs...");

      // Fetch data from APIs concurrently using Promise.all
      const [patientsData, appointmentsData, treatmentsData] =
        await Promise.all([
          fetchCount(apiEndpoints.patients),
          fetchCount(apiEndpoints.appointments),
          fetchCount(apiEndpoints.treatements),
        ]);

      // Hide loader and show content
      $(".baller-container").hide();
      $(".content-wrapper").show();

      console.log("Patients data fetched:", patientsData);
      console.log("Appointments data fetched:", appointmentsData);
      console.log("Treatment data fetched:", treatmentsData);

      // Process the treatment data to count occurrences of each treatment type
      const treatmentCounts = processTreatmentData(treatmentsData);
      console.log("Treatment counts:", treatmentCounts);

      // Get today's date in 'YYYY-MM-DD' format
      const today = new Date().toISOString().split("T")[0];

      // Filter the appointments for today's date and status 'Pending'
      const pendingTodayAppointments = appointmentsData.filter(
        (appointment) => {
          const appointmentDate = appointment.date_time.split(" ")[0]; // Get only the date part
          return (
            appointmentDate === today &&
            appointment.status.toLowerCase() === "pending"
          );
        }
      );

      // Update total counts
      $("#total_patients").text(patientsData.length || "N/A");
      $("#total_appointments").text(appointmentsData.length || "N/A");
      $("#pending_appointments").text(pendingTodayAppointments.length || "N/A");
      $("#treatements_given").text(treatmentsData.length || "N/A");

      // Process data for chart
      const patientData = processMonthlyData(patientsData, "date_of_admission");
      const appointmentData = processMonthlyData(appointmentsData, "date_time");

      // Update the bar chart with patient and appointment data
      initBarChart(patientData, appointmentData);

      // Initialize the donut chart with treatment data
      initDonutChart(treatmentCounts);

      // Display the top 10 appointments
      displayTopAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
      $("#total_patients").text("N/A");
      $("#total_appointments").text("N/A");
      $("#pending_appointments").text("N/A");
      $("#treatements_given").text("N/A");
    }
  }

  // Initialize data fetching
  updateData();

  // Function to initialize the bar chart with patient and appointment data
  function initBarChart(patientData, appointmentData) {
    var ctx = document.getElementById("bar-chart-example").getContext("2d");

    var data = {
      labels: patientData.categories, // Use the month categories from patients
      datasets: [
        {
          label: "Patients",
          backgroundColor: "#1dbfc1",
          borderColor: "#1dbfc1",
          data: patientData.counts, // Use the patient counts per month
        },
        {
          label: "Appointments",
          backgroundColor: "#209dff",
          borderColor: "#209dff",
          data: appointmentData.counts, // Use the appointment counts per month
        },
      ],
    };

    var options = {
      maintainAspectRatio: false,
      legend: { display: true },
      scales: {
        yAxes: [
          {
            gridLines: { display: false, color: "rgba(0,0,0,0.05)" },
            stacked: false,
            ticks: { stepSize: 10 }, // Adjust step size based on the count
          },
        ],
        xAxes: [
          {
            barPercentage: 0.7,
            categoryPercentage: 0.5,
            stacked: false,
            gridLines: { color: "rgba(0,0,0,0.01)" },
          },
        ],
      },
    };

    new Chart(ctx, {
      type: "bar",
      data: data,
      options: options,
    });
  }
});

// slimScroll
window.onload = function () {
  // Cache DOM Element
  var scrollable = $(".scrollable");

  // Keeping the Scrollable state separate
  var state = {
    pos: {
      lowest: 0,
      current: 0,
    },
    offset: {
      top: [0, 0], //Old Offset, New Offset
    },
  };
  //
  scrollable.slimScroll({
    height: "284px",
    width: "",
    start: "top",
  });
  //
  scrollable.slimScroll().bind("slimscrolling", function (e, pos) {
    // Update the Scroll Position and Offset

    // Highest Position
    state.pos.highest =
      pos !== state.pos.highest
        ? pos > state.pos.highest
          ? pos
          : state.pos.highest
        : state.pos.highest;

    // Update Offset State
    state.offset.top.push(pos - state.pos.lowest);
    state.offset.top.shift();

    if (state.offset.top[0] < state.offset.top[1]) {
      console.log("...Scrolling Down");
      // ... YOUR CODE ...
    } else if (state.offset.top[1] < state.offset.top[0]) {
      console.log("Scrolling Up...");
      // ... YOUR CODE ...
    } else {
      console.log("Not Scrolling");
      // ... YOUR CODE ...
    }
  });
};
