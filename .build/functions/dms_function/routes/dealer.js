const catalyst = require("zcatalyst-sdk-node");
const controller = require("../controllers/dealer");
const express = require("express");
const router = express.Router();

// Get all orders related to a dealer
router.get("/:dealerId/orders", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    let orders = await controller.getOrdersByDealer(capp, dealerId);
    return res.status(200).json({
      success: true,
      code: 200,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Add a technician under a dealer
router.post("/:dealerId/technicians", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  const technicianData = req.body;
  try {
    let newTechnician = await controller.addTechnician(
      capp,
      dealerId,
      technicianData
    );
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Technician added successfully.",
      technician: newTechnician,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all technicians related to a dealer
router.get("/:dealerId/technicians", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    let technicians = await controller.getTechniciansByDealer(capp, dealerId);
    return res.status(200).json({
      success: true,
      code: 200,
      technicians,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all service requests related to a technician
router.get("/:technicianId/requests", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  try {
    let requests = await controller.getServiceRequestsByTechnician(
      capp,
      technicianId
    );
    return res.status(200).json({
      success: true,
      code: 200,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all customers
router.get("/:DealerID/customers", async (req, res) => {
  const capp = catalyst.initialize(req);
  const id = req.params.DealerID;
  try {
    let customers = await controller.getAllCustomers(capp, id);
    return res.status(200).json({
      success: true,
      code: 200,
      customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Add a customer
router.post("/customers", async (req, res) => {
  const capp = catalyst.initialize(req);
  const customerData = req.body;
  try {
    let newCustomer = await controller.addCustomer(capp, customerData);
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Customer added successfully.",
      customer: newCustomer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// See all products
router.get("/products", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let products = await controller.getAllProducts(capp);
    return res.status(200).json({
      success: true,
      code: 200,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all inventory items related to a dealer
router.get("/:dealerId/inventory", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    let inventoryItems = await controller.getInventoryByDealer(capp, dealerId);
    return res.status(200).json({
      success: true,
      code: 200,
      inventory: inventoryItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Update inventory
router.post("/:dealerId/inventory", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  const inventoryData = req.body;
  try {
    let updatedInventory = await controller.updateInventory(
      capp,
      dealerId,
      inventoryData
    );
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Inventory updated successfully.",
      inventory: updatedInventory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});


// Get all inventory items related to a dealer
router.get("/:dealerId/inventory", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    let inventory = await controller.getInventoryByDealer(capp, dealerId);
    return res.status(200).json({
      success: true,
      code: 200,
      inventory
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message
    });
  }
});


module.exports = router;
