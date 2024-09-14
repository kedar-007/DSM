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
  function fetchDoctors(url) {
    return $.ajax({
      url: url,
      method: "GET",
      dataType: "json",
    });
  }

  // Example API URLs (replace with actual URLs)
  var apiEndpoints = {
    patients: "/server/dental_management_function/admin/patients", // API to get the count of patients
    appointments: "/server/dental_management_function/admin/appointments", // API to get the count of appointments
    staf: "/server/dental_management_function/admin/users", // API to get the count of staff
    hospitals: "/server/dental_management_function/admin/hospitals", // API to get the count of hospitals
    doctors: "/server/dental_management_function/admin/doctors", // API to get the list of doctors
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
  // Function to display top 10 appointments in a table
  function displayTopAppointments(appointments) {
    const sortedAppointments = appointments
      .sort((a, b) => new Date(b.date_time) - new Date(a.date_time)) // Sort by date descending
      .slice(0, 10); // Take top 10

    const appointmentTableBody = $("#appointments-table-body");
    appointmentTableBody.empty(); // Clear existing content

    sortedAppointments.forEach((appointment, index) => {
      // Convert status to uppercase and apply color based on status
      let status = appointment.status;
      console.log(status);
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

  // Asynchronous function to fetch data and update DOM and chart
  async function updateData() {
    try {
      console.log("Fetching data from APIs...");

      // Fetch data from APIs concurrently using Promise.all
      const [
        patientsData,
        appointmentsData,
        stafData,
        hospitalsData,
        doctorsData,
      ] = await Promise.all([
        fetchCount(apiEndpoints.patients),
        fetchCount(apiEndpoints.appointments),
        fetchCount(apiEndpoints.staf),
        fetchCount(apiEndpoints.hospitals),
        fetchDoctors(apiEndpoints.doctors),
      ]);

      console.log("Patients data fetched:", patientsData);
      console.log("Appointments data fetched:", appointmentsData);
      console.log("Staff data fetched:", stafData);
      console.log("Hospitals data fetched:", hospitalsData);
      console.log("Doctors data fetched:", doctorsData);
      $(".baller-container").hide();
      $(".content-wrapper").show();

      // Update total counts
      $("#total_patients").text(patientsData.length || "N/A");
      $("#total_appointments").text(appointmentsData.length || "N/A");
      $("#total_staff").text(stafData.length || "N/A");
      $("#total_clinics").text(hospitalsData.length || "N/A");

      // Process data for chart
      const patientData = processMonthlyData(patientsData, "date_of_admission");
      const appointmentData = processMonthlyData(appointmentsData, "date_time");

      console.log("Patient data processed:", patientData);
      console.log("Appointment data processed:", appointmentData);

      // Ensure categories are consistent across both datasets
      const allCategories = Array.from(
        new Set([...patientData.categories, ...appointmentData.categories])
      ).sort(); // Combine and sort categories

      // Align data with categories
      const alignData = (categories, data) => {
        const dataMap = data.categories.reduce((acc, category, i) => {
          acc[category] = data.counts[i];
          return acc;
        }, {});
        return categories.map((category) => dataMap[category] || 0);
      };

      var options = {
        series: [
          {
            name: "Appointments",
            data: alignData(allCategories, {
              categories: appointmentData.categories,
              counts: appointmentData.counts,
            }),
          },
          {
            name: "Patients",
            data: alignData(allCategories, {
              categories: patientData.categories,
              counts: patientData.counts,
            }),
          },
        ],
        chart: {
          height: 308,
          type: "area",
          toolbar: {
            show: false,
          },
        },
        colors: ["#1dbfc1", "#209dff"],
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: ["3", "3"],
          curve: "smooth",
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            inverseColors: false,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [20, 100, 100, 100],
          },
        },
        legend: {
          show: true,
          position: "top",
        },
        xaxis: {
          type: "category",
          categories: allCategories.map((month) => {
            const [year, monthNum] = month.split("-");
            return (
              new Date(year, monthNum - 1).toLocaleString("default", {
                month: "short",
              }) +
              " " +
              year
            );
          }),
        },
        tooltip: {
          x: {
            format: "MMM yyyy",
          },
        },
      };

      console.log("Chart options:", options);

      // Render the chart
      var chart = new ApexCharts(
        document.querySelector("#apexcharts-area"),
        options
      );
      chart.render();

      // Update the doctor list
      updateDoctorList(doctorsData);

      // Display the top 10 appointments
      displayTopAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
      // Optionally show an error indicator
      $("#total_patients").text("N/A");
      $("#total_staff").text("N/A");
      $("#total_hospitals").text("N/A");
      $("#total_appointments").text("N/A");
    }
  }

  // Function to update the doctor list in the DOM
  function updateDoctorList(doctors) {
    const doctorListContainer = $("#doctor-list");
    doctorListContainer.empty(); // Clear existing content

    doctors.forEach((doctor) => {
      const doctorItem = `
      <div class="d-flex align-items-center mb-15">
        <div class="me-15">
          <img
            src="../images/avatar/avatar-1.png"
            class="avatar avatar-lg rounded10 bg-primary-light"
            alt="${doctor.name}"
          />
        </div>
        <div class="d-flex flex-column flex-grow-1 fw-500">
          <a href="#" class="text-dark hover-primary mb-1 fs-14">${doctor.name}</a>
          <span class="text-fade">Dentist</span>
        </div>
        <div class="dropdown">
          <a
            class="px-10 pt-5"
            href="#"
            data-bs-toggle="dropdown"
            ><i class="ti-more-alt"></i
          ></a>
          <div class="dropdown-menu dropdown-menu-end">
            <a class="dropdown-item" href="#">Inbox</a>
            <a class="dropdown-item" href="#">Sent</a>
            <a class="dropdown-item" href="#">Spam</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="#">Draft</a>
          </div>
        </div>
      </div>
    `;
      doctorListContainer.append(doctorItem);
    });
  }

  // Initialize data fetching
  updateData();

  // Function to fetch data from the API and display it in a bar chart
  async function fetchDataAndRenderBarChart(apiUrl) {
    try {
      // Fetch data from the API
      const response = await fetch(apiUrl);
      const data = await response.json();
      const biils = await fetch(
        "/server/dental_management_function/admin/bills/all"
      );
      const billData = await biils.json();
      //Total bills
      $("#total_bills").text(`${billData.length || "N/A"}`);

      // Process the data for the chart
      const labels = data.map((item) => item.hospitalName);
      const revenues = data.map((item) => item.revenue);
      let total_revenue = (revenues) => {
        return revenues.reduce((acc, curr) => acc + curr, 0);
      };

      const totalRevenue = total_revenue(revenues);
      console.log("Total Revenue:", totalRevenue);
      $("#total_revenue").text(`₹${totalRevenue || "N/A"}`);

      // Prepare the chart data
      const ctx = document.getElementById("bar-chart-example").getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "#1dbfc1");
      gradient.addColorStop(1, "#209dff");

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels, // Hospital names
          datasets: [
            {
              label: "Revenue",
              backgroundColor: gradient,
              borderColor: gradient,
              data: revenues, // Revenue values
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          legend: { display: true },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Revenue",
              },
            },
            x: {
              title: {
                display: true,
                text: "Hospital Name",
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Call the function with your API URL
  fetchDataAndRenderBarChart(
    "/server/dental_management_function/admin/revenue"
  );

  // var options = {
  //   series: [
  //     {
  //       name: "Consultation",
  //       data: [45, 52, 38, 24, 56, 45, 47],
  //     },
  //     {
  //       name: "Patients",
  //       data: [35, 41, 62, 42, 51, 32, 35],
  //     },
  //   ],
  //   chart: {
  //     height: 308,
  //     type: "area",
  //     toolbar: {
  //       show: false,
  //     },
  //   },
  //   colors: ["#1dbfc1", "#209dff"],
  //   dataLabels: {
  //     enabled: false,
  //   },
  //   stroke: {
  //     width: ["3", "3"],
  //     curve: "smooth",
  //   },
  //   fill: {
  //     type: "gradient",
  //     gradient: {
  //       shadeIntensity: 1,
  //       inverseColors: false,
  //       opacityFrom: 0.45,
  //       opacityTo: 0.05,
  //       stops: [20, 100, 100, 100],
  //     },
  //   },
  //   legend: {
  //     show: true,
  //     position: "top",
  //   },
  //   xaxis: {
  //     type: "category",
  //     categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  //   },
  //   tooltip: {
  //     x: {
  //       format: "dd/MM/yy HH:mm",
  //     },
  //   },
  // };

  // var chart = new ApexCharts(
  //   document.querySelector("#apexcharts-area"),
  //   options
  // );
  // chart.render();

  ("use strict");

  var options = {
    series: [44, 55, 41, 17, 15],
    chart: {
      type: "donut",
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
    labels: ["Operation", "Theraphy", "Mediation", "Colestrol", "Heart Beat"],
    responsive: [
      {
        breakpoint: 1600,
        options: {
          chart: {
            width: 330,
          },
        },
      },
      {
        breakpoint: 500,
        options: {
          chart: {
            width: 280,
          },
        },
      },
    ],
  };

  var chart = new ApexCharts(document.querySelector("#chart123"), options);
  chart.render();

  var options = {
    series: [
      {
        name: "series1",
        data: [100, 80, 110, 80, 110],
      },
    ],
    chart: {
      height: 60,
      type: "area",
      toolbar: {
        show: false,
      },
      offsetY: 0,
    },
    colors: ["#000000"],
    fill: {
      colors: ["#ffffff"],
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: [0],
      curve: "smooth",
    },
    grid: {
      show: false,
      padding: {
        left: -10,
        top: -25,
        right: -0,
        bottom: -15,
      },
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: "datetime",
      categories: [
        "2018-09-19T00:00:00.000Z",
        "2018-09-19T01:30:00.000Z",
        "2018-09-19T02:30:00.000Z",
        "2018-09-19T03:30:00.000Z",
        "2018-09-19T04:30:00.000Z",
        "2018-09-19T05:30:00.000Z",
        "2018-09-19T06:30:00.000Z",
      ],
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false,
      marker: {
        show: false,
      },
      x: {
        format: "dd/MM/yy HH:mm",
      },
    },
    yaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
        formatter: function (val) {
          return val + "%";
        },
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#chart-widget1"), options);
  chart.render();

  var options = {
    series: [
      {
        name: "Online Sales",
        data: [44, 55, 57, 56, 61, 58, 63],
      },
      {
        name: "Offline Sales",
        data: [76, 85, 101, 98, 87, 105, 91],
      },
    ],
    chart: {
      type: "bar",
      height: 275,
      offsetX: -5,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    legend: {
      show: true,
      position: "bottom",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 3,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yaxis: {
      title: {
        text: "",
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "" + val + "k";
        },
      },
    },
  };

  var chart = new ApexCharts(
    document.querySelector("#statistics-chart"),
    options
  );
  chart.render();

  var options = {
    series: [
      {
        name: "Section 001",
        data: [44, 55, 41, 67, 22, 43],
      },
      {
        name: "Section 002",
        data: [13, 23, 20, 8, 13, 27],
      },
      {
        name: "Section 003",
        data: [50, 24, 30, 10, 16, 14],
      },
      {
        name: "Section 004",
        data: [30, 15, 35, 41, 20, 35],
      },
      {
        name: "Section 005",
        data: [11, 17, 15, 15, 21, 14],
      },
      {
        name: "Section 006",
        data: [21, 7, 25, 13, 22, 8],
      },
    ],
    chart: {
      type: "bar",
      height: 320,
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "top",
            offsetX: 0,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 0,
        columnWidth: "20%",
        dataLabels: {
          total: {
            enabled: false,
            style: {
              fontSize: "0px",
              fontWeight: 900,
            },
          },
        },
      },
    },
    grid: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: "category",
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    legend: {
      show: false,
      position: "right",
      offsetY: 40,
    },
    colors: ["#0d6efd", "#16C7F9", "#FFAA05", "#FC4438", "#54BA4A", "#6c757d"],
    fill: {
      opacity: 1,
    },
  };

  var chart = new ApexCharts(document.querySelector("#barchart"), options);
  chart.render();

  // ------------------------------
  // nightingale chart
  // ------------------------------
  // based on prepared DOM, initialize echarts instance
  var nightingaleChart = echarts.init(
    document.getElementById("nightingale-chart")
  );
  var option = {
    //  title: {
    //     text: 'Ningdinger Rose Map',
    //     subtext: 'Purely fictitious',
    //     x: 'center'
    // },

    // Add tooltip
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: +{c}$ ({d}%)",
    },

    // Add legend
    legend: {
      show: false,
      x: "left",
      y: "top",
      orient: "vertical",
      data: ["Miami", "New York", "California", "Chicago"],
    },

    color: ["#0d6efd", "#16C7F9", "#FFAA05", "#FC4438"],

    // Display toolbox
    toolbox: {
      show: false,
      orient: "vertical",
      feature: {
        mark: {
          show: false,
          title: {
            mark: "Markline switch",
            markUndo: "Undo markline",
            markClear: "Clear markline",
          },
        },
        dataView: {
          show: false,
          readOnly: false,
          title: "View data",
          lang: ["View chart data", "Close", "Update"],
        },
        magicType: {
          show: false,
          title: {
            pie: "Switch to pies",
            funnel: "Switch to funnel",
          },
          type: ["pie", "funnel"],
        },
        restore: {
          show: false,
          title: "Restore",
        },
        saveAsImage: {
          show: false,
          title: "Same as image",
          lang: ["Save"],
        },
      },
    },

    // Enable drag recalculate
    calculable: true,

    // Add series
    series: [
      {
        name: "Area Mode",
        type: "pie",
        radius: ["15%", "85%"],
        center: ["50%", "50%"],
        roseType: "area",

        // Funnel
        width: "40%",
        height: "50%",
        x: "0%",
        y: "0%",
        max: 250,
        sort: "ascending",

        data: [
          { value: 440, name: "Miami" },
          { value: 260, name: "New York" },
          { value: 350, name: "California" },
          { value: 250, name: "Chicago" },
        ],
        labelLine: {
          lineStyle: {
            color: "rgba(181, 181, 195, 0.8)",
          },
          smooth: 0.2,
          length: 5,
          length2: 5,
        },
      },
    ],
  };
  nightingaleChart.setOption(option);

  // bar chart
  $(".bar").peity("bar");

  // ------------------------------
  // pole chart
  // ------------------------------
  // based on prepared DOM, initialize echarts instance
  var poleChart = echarts.init(document.getElementById("pole-chart"));
  // Data style
  var dataStyle = {
    normal: {
      label: { show: false },
      labelLine: { show: false },
    },
  };

  // Placeholder style
  var placeHolderStyle = {
    normal: {
      color: "rgba(0,0,0,0)",
      label: { show: false },
      labelLine: { show: false },
    },
    emphasis: {
      color: "rgba(0,0,0,0)",
    },
  };
  var option = {
    // title: {
    //     text: 'Stacked histogram',
    //     subtext: 'Weekly Data',
    //     x: 'center',
    //     y: 'center',
    //     itemGap: 10,
    //     textStyle: {
    //         color: 'rgba(30,144,255,0.8)',
    //         fontSize: 19,
    //         fontWeight: '500'
    //     }
    // },

    // Add tooltip
    tooltip: {
      show: true,
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },

    // Add legend
    legend: {
      orient: "vertical",
      x: document.getElementById("pole-chart").offsetWidth / 2,
      y: 30,
      x: "55%",
      itemGap: 15,
      data: ["Google", "Personal", "Outher"],
    },

    // Add custom colors
    color: ["#F4972D", "#0052cc", "#898989"],

    // Add series
    series: [
      {
        name: "1",
        type: "pie",
        clockWise: false,
        radius: ["75%", "100%"],
        itemStyle: dataStyle,
        data: [
          {
            value: 75,
            name: "Google",
          },
          {
            value: 25,
            name: "invisible",
            itemStyle: placeHolderStyle,
          },
        ],
      },

      {
        name: "2",
        type: "pie",
        clockWise: false,
        radius: ["60%", "85%"],
        itemStyle: dataStyle,
        data: [
          {
            value: 50,
            name: "Personal",
          },
          {
            value: 50,
            name: "invisible",
            itemStyle: placeHolderStyle,
          },
        ],
      },

      {
        name: "3",
        type: "pie",
        clockWise: false,
        radius: ["45%", "70%"],
        itemStyle: dataStyle,
        data: [
          {
            value: 25,
            name: "Outher",
          },
          {
            value: 75,
            name: "invisible",
            itemStyle: placeHolderStyle,
          },
        ],
      },
    ],
  };
  poleChart.setOption(option);

  var options = {
    series: [
      {
        name: "PRODUCT A",
        data: [24, 65, 31, 37, 39, 62],
      },
      {
        name: "PRODUCT B",
        data: [-24, -65, -31, -37, -39, -62],
      },
    ],
    chart: {
      foreColor: "#bac0c7",
      type: "bar",
      height: 265,
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: true,
      },
    },
    grid: {
      show: true,
      borderColor: "#f7f7f7",
    },
    colors: ["#f2426d", "#4d7cff"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "15%",
        borderRadius: 3,
      },
    },
    dataLabels: {
      enabled: false,
    },

    xaxis: {
      type: "datetime",
      categories: [
        "01/01/2011 GMT",
        "01/02/2011 GMT",
        "01/03/2011 GMT",
        "01/04/2011 GMT",
        "01/05/2011 GMT",
        "01/06/2011 GMT",
      ],
    },
    yaxis: {
      axisBorder: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  };

  var chart = new ApexCharts(
    document.querySelector("#charts_widget_1_chart"),
    options
  );
  chart.render();

  // -----------------
  // - SPARKLINE BAR -
  // -----------------
  $(".sparkbar").each(function () {
    var $this = $(this);
    $this.sparkline("html", {
      type: "bar",
      height: $this.data("height") ? $this.data("height") : "30",
      barColor: $this.data("color"),
    });
  });

  $("#discretechart").sparkline([1, 4, 3, 7, 6, 4, 8, 9, 6, 8, 12], {
    type: "discrete",
    width: "80",
    height: "70",
    lineColor: "#745af2",
  });

  $("#baralc").sparkline(
    [
      32, 24, 26, 24, 32, 26, 40, 34, 22, 24, 22, 24, 34, 32, 38, 28, 36, 36,
      40, 38, 30, 34, 38,
    ],
    {
      type: "bar",
      height: "80",
      barWidth: 6,
      barSpacing: 4,
      barColor: "#faa700",
    }
  );

  $("#lineIncrease").sparkline([1, 8, 6, 5, 6, 8, 7, 9, 7, 8, 10, 16, 14, 10], {
    type: "line",
    width: "98%",
    height: "92",
    lineWidth: 2,
    lineColor: "#ffffff",
    fillColor: "rgba(255, 255, 255, 0)",
    spotColor: "#ffffff",
    minSpotColor: "#ffffff",
    maxSpotColor: "#ffffff",
    spotRadius: 1,
  });
});

// slimScroll-------------------------------------------------
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

// slimScroll------------------------------------------------- End
