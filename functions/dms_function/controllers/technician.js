const catalyst = require("zcatalyst-sdk-node");

// Get all pending services assigned to the technician
exports.getPendingServices = async (capp, technicianId) => {
  let items = await capp
    .zcql()
    .executeZCQLQuery(
      `SELECT * FROM ServiceRequests WHERE technician_id = ${technicianId} AND status = 'Pending'`
    )
    .catch(() => null);

  if (items == null || items == undefined) {
    return [];
  }
  return items.map((item) => item["ServiceRequests"]);
};

// Get all inventory items accessible by the technician
exports.getInventoryForTechnician = async (capp, technicianId) => {
  // Assuming there's a TechnicianInventory table linking technicians to inventory items
  let items = await capp
    .zcql()
    .executeZCQLQuery(
      `SELECT * FROM Inventory WHERE technician_id = ${technicianId}`
    )
    .catch(() => null);

  if (items == null || items == undefined) {
    return [];
  }
  return items.map((item) => item["Inventory"]);
};

// Get service history for the technician
exports.getServiceHistory = async (capp, technicianId) => {
  let history = await capp
    .zcql()
    .executeZCQLQuery(
      `SELECT * FROM ServiceRequests WHERE technician_id = ${technicianId} AND status = 'Completed'`
    )
    .catch(() => null);

  if (history == null || history == undefined) {
    return [];
  }
  return history.map((item) => item["ServiceRequests"]);
};

// Update the status of a service request
exports.updateServiceStatus = async (
  capp,
  technicianId,
  serviceId,
  updateData
) => {
  const datastore = capp.datastore();
  const table = datastore.table("ServiceRequests");

  // Construct a JSON Object with the updated row details
  let updatedRowData = {
    ROWID: serviceId,
    technician_id: technicianId, // Ensure the technician ID matches
    ...updateData,
  };

  try {
    // Use Table Meta Object to update a single row using ROWID which returns a promise
    let rowPromise = table.updateRow(updatedRowData);

    // Wait for the update operation to complete
    let updatedRow = await rowPromise;
    return updatedRow;
  } catch (error) {
    console.error("Failed to update the service:", error);
    throw new Error("Failed to update the service");
  }
};

// Add service history for the technician
exports.addServiceHistory = async (capp, technicianId, serviceData) => {
  const datastore = capp.datastore();
  const table = datastore.table("ServiceHistory");

  // Extract data
  const {
    DealerID,
    ServiceDescription,
    Status,
    ProductID,
    SpareParts,
    TotalTime,
  } = serviceData;

  // Construct a JSON Object with the service history details
  let rowData = {
    TechnicianID: technicianId,
    DealerID,
    ServiceDescription,
    Status,
    ProductID,
    SpareParts,
    TotalTime,
  };

  try {
    // Insert a new row
    let rowPromise = table.insertRow(rowData);

    // Wait for the insertion to complete
    let insertedRow = await rowPromise;
    return insertedRow;
  } catch (error) {
    console.error("Failed to add service history:", error);
    throw new Error("Failed to add service history");
  }
};

// Get completed services for the technician
exports.getCompletedServices = async (capp, technicianId) => {
  let services = await capp
    .zcql()
    .executeZCQLQuery(
      `SELECT * FROM ServiceRequests WHERE technician_id = ${technicianId} AND status = 'Completed'`
    )
    .catch(() => null);

  if (services == null || services == undefined) {
    return [];
  }
  return services.map((item) => item["ServiceRequests"]);
};

// Get a specific service by ID for the technician
exports.getServiceById = async (capp, technicianId, serviceId) => {
  const zcql = capp.zcql();
  const query = `SELECT * FROM ServiceRequests WHERE ROWID = ${serviceId} AND technician_id = ${technicianId}`;
  const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

  if (queryResp == null || queryResp.length === 0) {
    throw new Error("Service not found");
  }
  return queryResp[0]["ServiceRequests"];
};

exports.addSpareParts = async (capp, sparePartData) => {
  const datastore = capp.datastore();
  const table = datastore.table("SpareParts");

  // Check if the data is an array (bulk insert) or a single object
  if (!Array.isArray(sparePartData)) {
    sparePartData = [sparePartData]; // Convert to an array for uniform handling
  }

  // Construct an array of row data for each spare part
  const rowsToInsert = sparePartData.map((part) => ({
    ProductID: part.ProductID,
    PartName: part.PartName,
    Description: part.Description,
    Cost: part.Cost
  }));

  try {
    // Insert rows
    let rowsPromise = table.insertRows(rowsToInsert);
    let insertedRows = await rowsPromise;
    return insertedRows;
  } catch (error) {
    console.error("Failed to add spare parts:", error);
    throw new Error("Failed to add spare parts");
  }
};

exports.getAllSpareParts = async (capp) => {
  let items = await capp
    .zcql()
    .executeZCQLQuery(`SELECT * FROM SpareParts`)
    .catch(() => null);

  if (items == null || items == undefined) {
    throw new Error("Failed to fetch spare parts");
  }
  return items.map((item) => item["SpareParts"]);
};

module.exports = exports;
