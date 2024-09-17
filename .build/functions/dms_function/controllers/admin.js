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

//Get all Products
exports.getAllProducts = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Products`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Products");
  }

  return queryResp.map((item) => item.Products);
};

//Get product by id
exports.getProductById = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Products WHERE ROWID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Products");
  }

  return queryResp.map((item) => item.Products);
};

//Delete the product
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

// Create a new user and add to respective role table (Dealer or Technician)
exports.createUserWithRole = async (capp, userData) => {
  const {
    name,
    email,
    phone,
    password,
    status,
    role, // Should be 'Dealer' or 'Technician'
    address,
    city,
    state,
    dealer_id, // Specific to Technicians
    specialization, // Specific to Technicians
    PostalCode,
  } = userData;

  try {
    // Step 1: Insert into the Users table
    const userRowData = {
      name,
      email,
      phone,
      password,
      status,
      role, // Set the role to either 'Dealer' or 'Technician'
    };
    // console.log("usersData",userRowData)
    const usersTable = capp.datastore().table("Users");
    const userRowPromise = usersTable.insertRow(userRowData).catch(() => null);
    const userRow = await userRowPromise;

    if (userRow == null) {
      throw new Error("Failed to create user in Users table");
    }

    // Get the ROWID of the created user
    const userId = userRow.ROWID;

    // Wait for 5 seconds to ensure the user ID is available
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 2: Insert into the role-specific table
    let roleTableName;
    let roleRowData;

    if (role === "Dealer") {
      roleTableName = "Dealers";
      roleRowData = {
        userId, // Foreign key to the Users table
        DealerName: name,
        Email: email,
        Address: address,
        City: city,
        State: state,
        PostalCode,
        Phone: phone,
      };
    } else if (role === "Technician") {
      roleTableName = "Technicians";
      roleRowData = {
        userId, // Foreign key to the Users table
        TechnicianName: name,
        Email: email,
        Phone: phone,
        DealerID: dealer_id, // Reference to the associated dealer
        specialization,
        address,
      };
    } else {
      throw new Error("Invalid role");
    }

    const roleTable = capp.datastore().table(roleTableName);
    const roleRowPromise = roleTable.insertRow(roleRowData).catch(() => null);
    const roleRow = await roleRowPromise;

    if (roleRow == null) {
      throw new Error(`Failed to create user in ${roleTableName} table`);
    }

    // Return the user details and the associated role entry
    return {
      user: userRow,
      roleEntry: roleRow,
    };
  } catch (error) {
    console.error("Error creating user with role:", error);
    throw error; // Re-throwing the error to be handled by the caller
  }
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

// Create a new user and add to respective role table
exports.createUser = async (capp, userData) => {
  const {
    name,
    email,
    role,
    dealer_id,
    phone,
    password,
    status,
    specialization,
  } = userData;

  // Step 1: Insert into the Users table
  const userRowData = {
    name,
    email,
    phone,
    dealer_id,
    role,
    password,
    status,
  };

  const usersTable = capp.datastore().table("Users");
  const userRowPromise = usersTable.insertRow(userRowData).catch(() => null);
  const userRow = await userRowPromise;

  if (userRow == null) {
    throw new Error("Failed to create user in Users table");
  }

  // Get the ROWID of the created user
  const userId = userRow.ROWID;

  // Wait for 5 seconds to ensure the user ID is available
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 2: Insert into the role-specific table
  let roleTableName;
  let roleRowData;

  switch (role) {
    case "Technician":
      roleTableName = "Technicians";
      roleRowData = {
        user_id: userId, // Foreign key to the Users table
        name,
        email,
        phone,
        dealer_id,
        specialization, // Include specialization for Technicians
      };
      break;

    default:
      throw new Error("Invalid role");
  }

  console.log(roleRowData);
  console.log(roleTableName);

  const roleTable = capp.datastore().table(roleTableName);
  const roleRowPromise = roleTable.insertRow(roleRowData).catch(() => null);
  const roleRow = await roleRowPromise;

  if (roleRow == null) {
    throw new Error(`Failed to create user in ${roleTableName} table`);
  }

  // Return the user details and the associated role entry
  return {
    user: userRow,
    roleEntry: roleRow,
  };
};

// Fetch all users
exports.getAllUsers = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Users`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch users");
  }

  return queryResp.map((item) => item.Users);
};

// Fetch all technicians
exports.getAllTechnicians = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Technicians`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch technicians");
  }

  return queryResp.map((item) => item.Technicians);
};

// Fetch all data of a specific dealer including associated technicians
exports.getDealerDetails = async (capp, dealerId) => {
  const zcql = capp.zcql();

  // Fetch dealer details
  const dealerQuery = `SELECT * FROM Dealers WHERE ROWID = '${dealerId}'`;
  const dealerResp = await zcql.executeZCQLQuery(dealerQuery).catch(() => null);

  if (dealerResp == null || dealerResp.length === 0) {
    throw new Error("Dealer not found");
  }

  const dealer = dealerResp[0].Dealers;

  // Fetch associated technicians
  const techniciansQuery = `SELECT * FROM Technicians WHERE dealer_id = '${dealerId}'`;
  const techniciansResp = await zcql
    .executeZCQLQuery(techniciansQuery)
    .catch(() => null);

  if (techniciansResp == null) {
    throw new Error("Failed to fetch technicians");
  }

  const technicians = techniciansResp.map((item) => item.Technicians);

  // Fetch associated products
  const productsQuery = `SELECT * FROM Products WHERE dealer_id = '${dealerId}'`;
  const productsResp = await zcql
    .executeZCQLQuery(productsQuery)
    .catch(() => null);

  if (productsResp == null) {
    throw new Error("Failed to fetch products");
  }

  const products = productsResp.map((item) => item.Products);

  return {
    dealer,
    technicians,
    products,
  };
};

// Other functions for creating products, orders, and managing inventory would follow a similar pattern
// Insert new products, fetch all products, update, and delete products.
// Insert new orders, fetch all orders, update, and delete orders.
// Manage inventory with similar CRUD operations.

// Add Products (Bulk and Single)
exports.addProducts = async (capp, productData) => {
  // Check if productData is an array or a single object
  if (!Array.isArray(productData)) {
    // If it's a single object, convert it to an array with one item
    if (typeof productData === "object" && productData !== null) {
      productData = [productData];
    } else {
      throw new Error("Invalid productData format");
    }
  }

  // Ensure productData is now an array
  if (productData.length === 0) {
    throw new Error("Empty productData");
  }

  // Process each product data object
  const processedData = productData.map((product) => {
    const { ProductName, Category, Price, Description } = product;

    return {
      ProductName,
      Category,
      Price,
      Description,
    };
  });

  // Insert multiple rows into the datastore
  const datastore = capp.datastore();
  const table = datastore.table("Products"); // Assuming you have a "Products" table

  try {
    // Insert rows and await the promise
    const insertPromise = table.insertRows(processedData);
    const rows = await insertPromise;

    // Return the inserted rows
    return rows;
  } catch (error) {
    console.error("Failed to create products:", error);
    throw new Error("Failed to create products");
  }
};

(exports.updateProduct = async (capp, productId, updateData) => {
  console.log("Updating Patient with ID:", productId);
  console.log("Update data:", updateData);

  const datastore = capp.datastore();
  const table = datastore.table("Products");

  // Construct a JSON Object with the updated row details
  let updatedRowData = {
    ROWID: productId,
    ...updateData,
  };

  try {
    // Use Table Meta Object to update a single row using ROWID which returns a promise
    let rowPromise = table.updateRow(updatedRowData);

    // Wait for the update operation to complete
    let updatedRow = await rowPromise;

    // console.log("Row updated successfully:", updatedRow);
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the row:", error);
    throw new Error("Failed to update Product");
  }
}),
  // Add Orders (Bulk and Single)
  (exports.addOrders = async (capp, orderData) => {
    // Check if orderData is an array or a single object
    if (!Array.isArray(orderData)) {
      // If it's a single object, convert it to an array with one item
      if (typeof orderData === "object" && orderData !== null) {
        orderData = [orderData];
      } else {
        throw new Error("Invalid orderData format");
      }
    }

    // Ensure orderData is now an array
    if (orderData.length === 0) {
      throw new Error("Empty orderData");
    }

    // Process each order data object
    const processedData = orderData.map((order) => {
      const { DealerID, OrderDate, TotalAmount, OrderStatus, Products } = order;

      return {
        DealerID,
        OrderDate,
        TotalAmount,
        OrderStatus,
        Products: JSON.stringify(Products), // Convert Products array to a JSON string
      };
    });

    // Insert multiple rows into the datastore
    const datastore = capp.datastore();
    const table = datastore.table("Orders"); // Assuming you have an "Orders" table

    try {
      // Insert rows and await the promise
      const insertPromise = table.insertRows(processedData);
      const rows = await insertPromise;

      // Return the inserted rows
      return rows;
    } catch (error) {
      console.error("Failed to create orders:", error);
      throw new Error("Failed to create orders");
    }
  });

//Update order
exports.updateOrder = async (capp, orderId, updateData) => {
  console.log("Updating Patient with ID:", orderId);
  console.log("Update data:", updateData);

  const datastore = capp.datastore();
  const table = datastore.table("Orders");

  // Construct a JSON Object with the updated row details
  let updatedRowData = {
    ROWID: orderId,
    ...updateData,
  };

  try {
    // Use Table Meta Object to update a single row using ROWID which returns a promise
    let rowPromise = table.updateRow(updatedRowData);

    // Wait for the update operation to complete
    let updatedRow = await rowPromise;

    // console.log("Row updated successfully:", updatedRow);
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the row:", error);
    throw new Error("Failed to update hospital");
  }
};
//Get all Orders
exports.getAllOrders = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Orders`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Orders");
  }

  return queryResp.map((item) => item["Orders"]);
};

//Get perticular order detail
exports.getOrderById = async (capp, id) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Orders WHERE ROWID = ${id}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Products");
  }

  return queryResp.map((item) => item["Orders"]);
};

//Delete the Order
exports.deleteOrder = async (capp, id) => {
  const datastore = capp.datastore();
  const table = datastore.table("Orders");
  try {
    // Delete the row
    const res = await table.deleteRow(id);

    // Return the deleted row data
    return res;
  } catch (error) {
    console.error("Failed to delete Orders:", error);
    throw new Error("Failed to delete Orders");
  }
};

// Fetch all users
exports.getServices = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM ServiceRequests`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch ServiceRequests");
  }

  return queryResp.map((item) => item.ServiceRequests);
};

//Get techs
exports.getTechs = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Technicians`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Technicians");
  }

  return queryResp.map((item) => item.Technicians);
};

exports.addServiceRequest = async (capp, serviceRequestData) => {
  const datastore = capp.datastore();
  const table = datastore.table("ServiceRequests");
  console.log("data", serviceRequestData);

  // Prepare the row data for insertion
  const rowData = {
    DealerID: serviceRequestData.DealerID,
    TechnicianID: serviceRequestData.TechnicianID,
    RequestDate: serviceRequestData.RequestDate,
    Description: serviceRequestData.Description,
    Status: serviceRequestData.Status,
    ProductID: serviceRequestData.ProductID,
  };

  const insertedRow = await table.insertRow(rowData);
  console.log(insertedRow);
  return insertedRow;
};

exports.updateServiceRequest = async (capp, requestId, updateData) => {
  const datastore = capp.datastore();
  const table = datastore.table("ServiceRequests");

  // Prepare the row data for update
  const rowData = {
    ROWID: requestId,
    DealerID: updateData.DealerID,
    TechnicianID: updateData.TechnicianID,
    RequestDate: updateData.RequestDate,
    Description: updateData.Description,
    Status: updateData.Status,
    ProductID: updateData.ProductID,
  };

  const updatedRow = await table.updateRow(rowData);
  return updatedRow;
};

exports.deleteServiceRequest = async (capp, requestId) => {
  const datastore = capp.datastore();
  const table = datastore.table("ServiceRequests");

  // Delete the row by ID
  await table.deleteRow(requestId);
};


//Get All Inventory
exports.getAllInventory = async (capp) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM Inventory`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null) {
    throw new Error("Failed to fetch Inventory");
  }

  return queryResp.map((item) => item.Inventory);
};
module.exports = exports;
