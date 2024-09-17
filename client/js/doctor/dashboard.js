$(function () {
  "use strict";

  $(".baller-container").show();
  $(".content-wrapper").hide();

  // Retrieve user name from local storage and display it
  var userName = localStorage.getItem("userName");
  if (userName) {
    $("#userName").html("Hello,<br>" + userName);
  }

  // Function to fetch data from the API
  function fetchData(url) {
    return $.ajax({
      url: url,
      method: "GET",
      dataType: "json",
    });
  }

  // API URLs (replace with actual URLs)
  var apiEndpoints = {
    products: "/server/dms_function/admin/products",
    orders: "/server/dms_function/admin/orders",
    spares: "/server/dms_function/admin/orders",
    tech: "/server/dms_function/admin/orders",
  };

  // Asynchronous function to fetch data and update DOM and charts
  async function updateData() {
    try {
      console.log("Fetching data from APIs...");

      // Fetch data from APIs concurrently using Promise.all
      const [productsData, ordersData] = await Promise.all([
        fetchData(apiEndpoints.products),
        fetchData(apiEndpoints.orders),
      ]);

      console.log("Products data fetched:", productsData);
      console.log("Orders data fetched:", ordersData);

      // Update total counts
      $("#total_products").text(productsData.length || "N/A");
      $("#total_orders").text(ordersData.length || "N/A");

      // Render charts
      renderAreaChart(ordersData);
      renderPieChart(productsData);

      // Display recent orders
      displayRecentOrders(ordersData);
      $(".baller-container").hide();
      $(".content-wrapper").show();
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }

  // Function to render area chart
  function renderAreaChart(ordersData) {
    // Process data for area chart
    const orderCounts = ordersData.map((order) => ({
      date: order.OrderDate,
      count: JSON.parse(order.Products).length, // Parse Products as JSON and get length
    }));

    var options = {
      series: [
        {
          name: "Orders",
          data: orderCounts.map((o) => o.count),
        },
      ],
      chart: {
        height: 308,
        type: "area",
        toolbar: { show: false },
      },
      colors: ["#1dbfc1"],
      dataLabels: { enabled: false },
      stroke: { width: ["3"], curve: "smooth" },
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
      xaxis: {
        type: "category",
        categories: orderCounts.map((o) => o.date),
      },
    };

    var chart = new ApexCharts(
      document.querySelector("#apexcharts-area"),
      options
    );
    chart.render();
  }

  // Function to render pie chart
  function renderPieChart(productsData) {
    const productCategories = productsData.reduce((acc, product) => {
      acc[product.Category] = (acc[product.Category] || 0) + 1;
      return acc;
    }, {});

    const ctx = document.getElementById("pie-chart-example").getContext("2d");

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(productCategories),
        datasets: [
          {
            label: "Product Categories",
            data: Object.values(productCategories),
            backgroundColor: [
              "#3246D3",
              "#00D0FF",
              "#ee3158",
              "#ffa800",
              "#1dbfc1",
            ],
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        legend: { position: "bottom" },
      },
    });
  }

  // Function to display recent orders in a table
  function displayRecentOrders(orders) {
    const ordersTableBody = $("#recentOrders");
    ordersTableBody.empty();

    orders.forEach((order, index) => {
      let productsArray;
      try {
        productsArray = JSON.parse(order.Products);
      } catch (e) {
        productsArray = [];
      }

      const productNames = productsArray.join(", ");
      const formattedOrderID = "ORD" + order.ROWID.slice(-4);

      const orderRow = `
        <tr>
          <td>${index + 1}</td>
          <td>${formattedOrderID}</td>
          <td>${new Date(order.OrderDate).toLocaleString()}</td>
          <td>${productNames}</td>
          <td>${order.OrderStatus}</td>
        </tr>
      `;
      ordersTableBody.append(orderRow);
    });
  }

  // Initialize data fetching
  updateData();
});
