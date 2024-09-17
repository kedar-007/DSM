const catalyst = require("zcatalyst-sdk-node");
const controller = require("../controllers/admin");
const express = require("express");
const router = express.Router();

// Get all dealers
router.get("/dealer/all", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let dealers = await controller.getAllDealers(capp);
    return res.status(200).json(dealers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get dealer by ID
router.get("/dealer/:dealerId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    let dealer = await controller.getDealerById(capp, dealerId);
    return res.status(200).json(dealer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a User with role
router.post("/user", async (req, res) => {
  const capp = catalyst.initialize(req);
  const userData = req.body;
  try {
    let newUser = await controller.createUserWithRole(capp, userData);
    // Return success: true along with the new user data
    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update dealer by ID
router.put("/dealer/:dealerId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  const updateData = req.body;
  try {
    let updatedDealer = await controller.updateDealer(
      capp,
      dealerId,
      updateData
    );
    return res.status(200).json(updatedDealer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a dealer
router.delete("/dealer/:dealerId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const dealerId = req.params.dealerId;
  try {
    await controller.deleteDealer(capp, dealerId);
    return res.status(200).json({ message: "Dealer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get("/products", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let products = await controller.getAllProducts(capp);
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get("/product/:productId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const productId = req.params.productId;
  try {
    let product = await controller.getProductById(capp, productId);
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a new product
router.post("/product", async (req, res) => {
  const capp = catalyst.initialize(req);
  const productData = req.body;
  try {
    await controller.addProducts(capp, productData);
    // Send a success response
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Products added successfully.",
    });
  } catch (error) {
    // Send an error response
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Update product by ID
router.put("/product/:productId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const productId = req.params.productId;
  const updateData = req.body;
  try {
    let updatedProduct = await controller.updateProduct(
      capp,
      productId,
      updateData
    );
    return res.status(200).json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a product
router.delete("/product/:productId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const productId = req.params.productId;
  try {
    await controller.deleteProduct(capp, productId);
    // Send a success response
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    // Send an error response
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all orders
router.get("/orders", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let orders = await controller.getAllOrders(capp);
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get("/order/:orderId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const orderId = req.params.orderId;
  try {
    let order = await controller.getOrderById(capp, orderId);
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a new order
router.post("/order", async (req, res) => {
  const capp = catalyst.initialize(req);
  const orderData = req.body;
  try {
    await controller.addOrders(capp, orderData);
    // Send a success response
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Order created successfully.",
    });
  } catch (error) {
    // Send an error response
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Update order by ID
router.put("/order/:orderId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const orderId = req.params.orderId;
  const updateData = req.body;
  try {
    let updatedOrder = await controller.updateOrder(capp, orderId, updateData);
    return res.status(200).json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete an order
router.delete("/order/:orderId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const orderId = req.params.orderId;
  try {
    await controller.deleteOrder(capp, orderId);
    // Send a success response
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Order deleted successfully.",
    });
  } catch (error) {
    // Send an error response
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let users = await controller.getAllUsers(capp);
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/user/:userId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const userId = req.params.userId;
  try {
    let user = await controller.getUserById(capp, userId);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a new user
router.post("/user", async (req, res) => {
  const capp = catalyst.initialize(req);
  const userData = req.body;
  try {
    let newUser = await controller.createUser(capp, userData);
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update user by ID
router.put("/user/:userId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const userId = req.params.userId;
  const updateData = req.body;
  try {
    let updatedUser = await controller.updateUser(capp, userId, updateData);
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a user
router.delete("/user/:userId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const userId = req.params.userId;
  try {
    await controller.deleteUser(capp, userId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/serviceRequests", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let services = await controller.getServices(capp);
    return res.status(200).json(services);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Get all technicains
router.get("/techs", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let techs = await controller.getTechs(capp);
    return res.status(200).json(techs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Add a new service request
router.post("/request/add", async (req, res) => {
  console.log("I am entered");
  const capp = catalyst.initialize(req);
  const serviceRequestData = req.body;
  try {
    let newServiceRequest = await controller.addServiceRequest(capp, serviceRequestData);
    return res.status(201).json({ success: true, serviceRequest: newServiceRequest });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update service request by ID
router.put("/service_request/update/:requestId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const requestId = req.params.requestId;
  const updateData = req.body;
  try {
    let updatedServiceRequest = await controller.updateServiceRequest(capp, requestId, updateData);
    return res.status(200).json({ success: true, serviceRequest: updatedServiceRequest });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a service request
router.delete("/service_request/delete/:requestId", async (req, res) => {
  const capp = catalyst.initialize(req);
  const requestId = req.params.requestId;
  try {
    await controller.deleteServiceRequest(capp, requestId);
    return res.status(200).json({ success: true, message: "Service request deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});


// Get all inventory of all dealers
router.get("/dealers/inverntory", async (req, res) => {
  const capp = catalyst.initialize(req);
  try {
    let orders = await controller.getAllInventory(capp);
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// Export the router
module.exports = router;
