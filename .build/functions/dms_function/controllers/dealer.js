const catalyst = require("zcatalyst-sdk-node");

// Fetch all dealers
exports.getAllDealers = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Dealers`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch dealers");
  }

  return queryResp.map((item) => item.Dealers);
};

// Fetch dealer by ID
exports.getDealerById = async (capp, dealerId) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Dealers WHERE ROWID='${dealerId}'`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null || queryResp.length === 0) {
    throw new Error("Dealer not found");
  }

  return queryResp[0].Dealers;
};

// Update dealer by ID
exports.updateDealer = async (capp, dealerId, updateData) => {
  const datastore = capp.datastore();
  const table = datastore.table("Dealers");

  let updatedRowData = {
    ROWID: dealerId,
    ...updateData,
  };

  try {
    let rowPromise = table.updateRow(updatedRowData);
    let updatedRow = await rowPromise;
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the row:", error);
    throw new Error("Failed to update dealer");
  }
};

// Fetch all products
exports.getAllProducts = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Products`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Products");
  }

  return queryResp.map((item) => item.Products);
};

// Fetch product by ID
exports.getProductById = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Products WHERE ROWID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Products");
  }

  return queryResp.map((item) => item.Products);
};

// Delete the product
exports.deleteProduct = async (capp, id) => {
  const datastore = capp.datastore();
  const table = datastore.table("Products");
  try {
    // Delete the row
    const res = await table.deleteRow(id);
    // Return the deleted row data
    return res;
  } catch (error) {
    console.error("Failed to delete Products:", error);
    throw new Error("Failed to delete Products");
  }
};

// Add Products (Bulk and Single)
exports.addProducts = async (capp, productData) => {
  // Check if productData is an array or a single object
  if (!Array.isArray(productData)) {
    if (typeof productData === "object" && productData !== null) {
      productData = [productData];
    } else {
      throw new Error("Invalid productData format");
    }
  }

  if (productData.length === 0) {
    throw new Error("Empty productData");
  }

  const processedData = productData.map((product) => {
    const { ProductName, Category, Price, Description } = product;
    return { ProductName, Category, Price, Description };
  });

  const datastore = capp.datastore();
  const table = datastore.table("Products");

  try {
    const insertPromise = table.insertRows(processedData);
    const rows = await insertPromise;
    return rows;
  } catch (error) {
    console.error("Failed to create products:", error);
    throw new Error("Failed to create products");
  }
};

// Update product
exports.updateProduct = async (capp, productId, updateData) => {
  const datastore = capp.datastore();
  const table = datastore.table("Products");

  let updatedRowData = {
    ROWID: productId,
    ...updateData,
  };

  try {
    let rowPromise = table.updateRow(updatedRowData);
    let updatedRow = await rowPromise;
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the row:", error);
    throw new Error("Failed to update Product");
  }
};

// Fetch all orders related to a dealer
exports.getOrdersByDealer = async (capp, dealerId) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Orders WHERE DealerID = '${dealerId}'`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch orders");
  }

  return queryResp.map((item) => item["Orders"]);
};

// Add Orders (Bulk and Single)
exports.addOrders = async (capp, orderData) => {
  if (!Array.isArray(orderData)) {
    if (typeof orderData === "object" && orderData !== null) {
      orderData = [orderData];
    } else {
      throw new Error("Invalid orderData format");
    }
  }

  if (orderData.length === 0) {
    throw new Error("Empty orderData");
  }

  const processedData = orderData.map((order) => {
    const { DealerID, OrderDate, TotalAmount, OrderStatus, Products } = order;
    return {
      DealerID,
      OrderDate,
      TotalAmount,
      OrderStatus,
      Products: JSON.stringify(Products),
    };
  });

  const datastore = capp.datastore();
  const table = datastore.table("Orders");

  try {
    const insertPromise = table.insertRows(processedData);
    const rows = await insertPromise;
    return rows;
  } catch (error) {
    console.error("Failed to create orders:", error);
    throw new Error("Failed to create orders");
  }
};

// Update order
exports.updateOrder = async (capp, orderId, updateData) => {
  const datastore = capp.datastore();
  const table = datastore.table("Orders");

  let updatedRowData = {
    ROWID: orderId,
    ...updateData,
  };

  try {
    let rowPromise = table.updateRow(updatedRowData);
    let updatedRow = await rowPromise;
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the row:", error);
    throw new Error("Failed to update order");
  }
};

// Get order by ID
exports.getOrderById = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Orders WHERE ROWID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch orders");
  }

  return queryResp.map((item) => item["Orders"]);
};

// Delete the order
exports.deleteOrder = async (capp, id) => {
  const datastore = capp.datastore();
  const table = datastore.table("Orders");
  try {
    const res = await table.deleteRow(id);
    return res;
  } catch (error) {
    console.error("Failed to delete order:", error);
    throw new Error("Failed to delete order");
  }
};

// Add Technicians
exports.addTechnician = async (capp, dealerId, technicianData) => {
  const { TechnicianName, Email, Phone, specialization, address } =
    technicianData;

  const rowData = {
    DealerID: dealerId,
    TechnicianName,
    Email,
    Phone,
    specialization,
    address,
  };

  const table = capp.datastore().table("Technicians");

  try {
    const row = await table.insertRow(rowData);
    return row;
  } catch (error) {
    console.error("Failed to add technician:", error);
    throw new Error("Failed to add technician");
  }
};

// Fetch all technicians related to a dealer
exports.getTechniciansByDealer = async (capp, dealerId) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Technicians WHERE DealerID = '${dealerId}'`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch technicians");
  }

  return queryResp.map((item) => item.Technicians);
};

// Fetch all customers
exports.getAllCustomers = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Customers WHERE DealerID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch customers");
  }

  return queryResp.map((item) => item.Customers);
};

// Add a customer
exports.addCustomer = async (capp, customerData) => {
  const { name, phone, email, address, ProductID, DealerID } = customerData;

  const rowData = {
    name,
    phone,
    email,
    address,
    ProductID,
    DealerID,
  };

  const table = capp.datastore().table("Customers");

  try {
    const row = await table.insertRow(rowData);
    return row;
  } catch (error) {
    console.error("Failed to add customer:", error);
    throw new Error("Failed to add customer");
  }
};

// Fetch all service requests by technician
exports.getServiceRequestsByTechnician = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM ServiceRequests WHERE TechnicianID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch ServiceRequests");
  }

  return queryResp.map((item) => item.ServiceRequests);
};

// Fetch all inventory items related to a dealer
exports.getInventoryByDealer = async (capp, dealerId) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Inventory WHERE DealerID = '${dealerId}'`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch inventory");
  }

  return queryResp.map((item) => item.Inventory);
};

// Update inventory for a dealer
exports.updateInventory = async (capp, dealerId, inventoryData) => {
  const datastore = capp.datastore();
  const table = datastore.table("Inventory");

  // Check if inventoryData is an array or a single object
  if (!Array.isArray(inventoryData)) {
    // If it's a single object, convert it to an array with one item
    if (typeof inventoryData === "object" && inventoryData !== null) {
      inventoryData = [inventoryData];
    } else {
      throw new Error("Invalid inventoryData format");
    }
  }

  // Ensure inventoryData is now an array
  if (inventoryData.length === 0) {
    throw new Error("Empty inventoryData");
  }

  // Process each inventory data object
  const processedData = inventoryData.map((inventory) => {
    const { ProductID, StockQuantity } = inventory;

    return {
      DealerID: dealerId,
      ProductID,
      StockQuantity,
    };
  });

  try {
    // Insert or update rows into the datastore
    const insertPromise = table.insertRows(processedData);
    const rows = await insertPromise;

    // Return the inserted/updated rows
    return rows;
  } catch (error) {
    console.error("Failed to update inventory:", error);
    throw new Error("Failed to update inventory");
  }
};


// Add Inventory for a Dealer
exports.addInventory = async (capp, dealerId, inventoryData) => {
  // Check if inventoryData is an array
  if (!Array.isArray(inventoryData)) {
    throw new Error("Invalid inventoryData format");
  }

  const datastore = capp.datastore();
  const table = datastore.table("Inventory"); // Assuming your table name is "Inventory"
  
  try {
    // Process each inventory item
    const addedRows = await Promise.all(inventoryData.map(async (item) => {
      const { ProductID, StockQuantity} = item;

      // Create inventory data
      const inventoryRowData = {
        DealerID: dealerId,
        ProductID,
        StockQuantity
      };

      // Insert new inventory row
      return await table.insertRow(inventoryRowData);
    }));

    // Return the newly added inventory rows
    return addedRows;
  } catch (error) {
    console.error("Failed to add inventory:", error);
    throw new Error("Failed to add inventory");
  }
};

module.exports = exports;
