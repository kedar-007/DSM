const express = require("express");
const catalyst = require("zcatalyst-sdk-node");
const controller = require("../controllers/technician");

const router = express.Router();

// Get all pending services assigned to the technician
router.get("/:technicianId/services/pending", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  try {
    let services = await controller.getPendingServices(capp, technicianId);
    return res.status(200).json(services);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all inventory items accessible by the technician
router.get("/:technicianId/inventory", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  try {
    let inventory = await controller.getInventoryForTechnician(capp, technicianId);
    return res.status(200).json(inventory);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get service history for the technician
router.get("/:technicianId/service/history", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  try {
    let history = await controller.getServiceHistory(capp, technicianId);
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update the status of a service request
router.put("/:technicianId/service/:serviceId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  const serviceId = req.params.serviceId;
  const updateData = req.body; // Should include the updated status and other fields if needed
  try {
    let updatedService = await controller.updateServiceStatus(capp, technicianId, serviceId, updateData);
    return res.status(200).json(updatedService);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add service history for the technician
router.post("/:technicianId/service/history", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  const serviceData = req.body; // Should include service details like description, status, etc.
  try {
    let newServiceHistory = await controller.addServiceHistory(capp, technicianId, serviceData);
    return res.status(201).json(newServiceHistory);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get completed services for the technician
router.get("/:technicianId/services/completed", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  try {
    let completedServices = await controller.getCompletedServices(capp, technicianId);
    return res.status(200).json(completedServices);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get a specific service by ID for the technician
router.get("/:technicianId/service/:serviceId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const technicianId = req.params.technicianId;
  const serviceId = req.params.serviceId;
  try {
    let service = await controller.getServiceById(capp, technicianId, serviceId);
    return res.status(200).json(service);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add single or multiple spare parts to the inventory
router.post("/spareParts/add", async (req, res) => {
  const capp = catalyst.initialize(req);
  const sparePartData = req.body; // Spare part details from the request body

  try {
    let newSpareParts = await controller.addSpareParts(capp, sparePartData);
    return res.status(201).json({
      success: true,
      message: "Spare parts added successfully",
      spareParts: newSpareParts
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all spare parts
router.get("/spareParts/all", async (req, res) => {
  const capp = catalyst.initialize(req);

  try {
    let spareParts = await controller.getAllSpareParts(capp);
    return res.status(200).json(spareParts);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
