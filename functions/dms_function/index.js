const express = require("express");
const cors = require("cors");
const validateUser = require("./middleware/validateUser");

const app = express();

// Middleware setup
app.use(express.json()); // JSON body parsing
app.use(cors()); // Enable CORS
console.log("Middleware set up.");

// Basic route
app.get("/", (req, res) => {
  console.log("Received GET request on /");
  res.send("Hello");
});

// Login route
app.post("/login", validateUser, (req, res) => {
  const user = req.user; // User details from the middleware
  console.log("Here is the main user", { user });

  res.json({
    userId: user.id,
    email: user.email,
    role: user.role,
    dealerId: user.dealerId, // Assuming dealerId is part of user details
    userName: user.userName,
		technicianId: user.technicianId,
  });
});

// Include role-specific routes
app.use("/admin",require("./routes/admin")); // Admin routes
app.use("/dealer", require("./routes/dealer")); // Dealer routes
app.use("/technician", require("./routes/technician")); // Technician routes


module.exports = app;
console.log("Express app module exported.");
