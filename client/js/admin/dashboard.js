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
    dealers: "/server/dms_function/admin/dealer/all",
    products: "/server/dms_function/admin/products",
    orders: "/server/dms_function/admin/orders",
    inventory: "/server/dms_function/admin/dealers/inverntory",
    technicians: "/server/dms_function/admin/techs", // New endpoint for technicians
  };

  // Asynchronous function to fetch data and update DOM and charts
  async function updateData() {
    try {
      console.log("Fetching data from APIs...");

      // Fetch data from APIs concurrently using Promise.all
      const [
        dealersData,
        productsData,
        ordersData,
        inventoryData,
        techniciansData, // Fetch technicians data
      ] = await Promise.all([
        fetchData(apiEndpoints.dealers),
        fetchData(apiEndpoints.products),
        fetchData(apiEndpoints.orders),
        fetchData(apiEndpoints.inventory),
        fetchData(apiEndpoints.technicians),
      ]);

      console.log("Dealers data fetched:", dealersData);
      console.log("Products data fetched:", productsData);
      console.log("Orders data fetched:", ordersData);
      console.log("Inventory data fetched:", inventoryData);
      console.log("Technicians data fetched:", techniciansData);

      // Update total counts
      $("#total_dealers").text(dealersData.length || "N/A");
      $("#total_products").text(productsData.length || "N/A");
      $("#total_inventory").text(inventoryData.length || "N/A");
      $("#total_technicians").text(techniciansData.length || "N/A"); // Display technician count

      // Render charts
      renderAreaChart(ordersData);
      renderBarChart(productsData);
      renderDonutChart(productsData);
      renderStackedBarChart(inventoryData);

      // Update the dealer list
      updateDealerList(dealersData);

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

  // Function to render bar chart
  function renderBarChart(productsData) {
    // Process data for bar chart
    const productCategories = productsData.reduce((acc, product) => {
      acc[product.Category] = (acc[product.Category] || 0) + 1;
      return acc;
    }, {});

    const ctx = document.getElementById("bar-chart-example").getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#1dbfc1");
    gradient.addColorStop(1, "#209dff");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(productCategories),
        datasets: [
          {
            label: "Product Categories",
            backgroundColor: gradient,
            borderColor: gradient,
            data: Object.values(productCategories),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: true },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Count" },
          },
          x: {
            title: { display: true, text: "Categories" },
          },
        },
      },
    });
  }

  // Function to render donut chart
  function renderDonutChart(productsData) {
    const productCategories = productsData.reduce((acc, product) => {
      acc[product.Category] = (acc[product.Category] || 0) + 1;
      return acc;
    }, {});

    var options = {
      series: Object.values(productCategories),
      chart: { type: "donut" },
      colors: ["#3246D3", "#00D0FF", "#ee3158", "#ffa800", "#1dbfc1"],
      labels: Object.keys(productCategories),
      legend: { position: "bottom" },
      plotOptions: {
        pie: { donut: { size: "45%" } },
      },
    };

    var chart = new ApexCharts(document.querySelector("#chart123"), options);
    chart.render();
  }

  // Function to render stacked bar chart
  function renderStackedBarChart(inventoryData) {
    // Process data for stacked bar chart
    const inventoryBreakdown = inventoryData.reduce((acc, item) => {
      acc[item.ProductID] = acc[item.ProductID] || {
        name: item.ProductID,
        data: [],
      };
      acc[item.ProductID].data.push(parseInt(item.StockQuantity));
      return acc;
    }, {});

    var options = {
      series: Object.values(inventoryBreakdown),
      chart: {
        type: "bar",
        height: 320,
        stacked: true,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 0,
          columnWidth: "20%",
        },
      },
      xaxis: {
        type: "category",
        categories: inventoryData.map((i) => i.ProductID),
      },
      yaxis: { labels: { show: false } },
      legend: { position: "top" },
    };

    var chart = new ApexCharts(document.querySelector("#barchart"), options);
    chart.render();
  }

  // Function to update the dealer list in the DOM
  function updateDealerList(dealers) {
    console.log("Dealers", dealers);
    const dealerListContainer = $("#dealer-list");
    dealerListContainer.empty();

    dealers.forEach((dealer) => {
      console.log("Dealer in a loop", dealer);
      // Extract last 4 digits and add prefix 'DL'
      const formattedDealerID = "DL" + dealer.ROWID.slice(-4);
      const dealerItem = `
              <div class="d-flex align-items-center mb-15">
                  <div class="d-flex flex-column flex-grow-1 fw-500">
                      <a href="#" class="text-dark hover-primary mb-1 fs-14">${dealer.DealerName}</a>
                      <span class="text-fade">Dealer ID: ${formattedDealerID}</span>
                  </div>
              </div>
          `;
      dealerListContainer.append(dealerItem);
    });
  }

  // Function to display recent orders in a table
  function displayRecentOrders(orders) {
    const ordersTableBody = $("#recentOrders");
    ordersTableBody.empty();
    console.log("recent Orders", orders);

    orders.forEach((order, index) => {
      // Parse the Products field if it's a stringified array
      let productsArray;
      try {
        productsArray = JSON.parse(order.Products);
      } catch (e) {
        productsArray = [];
      }

      const productNames = productsArray.join(", "); // Join product names for display
      // Extract last 4 digits and add prefix 'DL'
      const formattedDealerID = "DL" + order.DealerID.slice(-4);

      const orderRow = `
              <tr>
                  <td>${index + 1}</td>
                  <td>${formattedDealerID}</td>
                  <td>${new Date(order.OrderDate).toLocaleString()}</td>
                  <td>${productNames}</td>
                  <td>${order.OrderStatus}</td>
                  <td>${order.TotalAmount}</td>
              </tr>
          `;
      ordersTableBody.append(orderRow);
    });
  }

  // Initialize data fetching
  updateData();
});
