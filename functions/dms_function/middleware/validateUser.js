const catalyst = require("zcatalyst-sdk-node");

const validateUser = async (req, res, next) => {
  console.log("Hello I am entered");
  const { email, password } = req.body;

  console.log(`Validating user email: ${email}`);

  // Check if email and password are provided
  if (!email || !password) {
    console.log("Email or password not provided.");
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("Invalid email format.");
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const capp = catalyst.initialize(req);
    const zcql = capp.zcql(); // Initialize ZCQL

    // Use ZCQL to query the Users table
    const query = `SELECT * FROM Users WHERE email = '${email}'`;
    const queryResp = await zcql.executeZCQLQuery(query).catch(() => null);

    // Handle user not found
    if (queryResp == null || queryResp.length === 0) {
      console.log("User not found.");
      return res.status(404).json({ error: "User not found" });
    }

    const user = queryResp[0]; // Assuming the first record is the user
    // Validate password
    if (user.Users.password !== password) {
      console.log("Invalid password.");
      return res.status(401).json({ error: "Invalid password" });
    }

    let userId = user.Users.ROWID;
    let dealerId = null; // Initialize dealerId
    let technicianId = null; // Initialize technicianId

    console.log("Role:", user.Users.role);

    // Check the role and fetch the ROWID from the specific table if needed
    if (user.Users.role) {
      const role = user.Users.role.toUpperCase();

      if (role === "DEALER") {
        // Fetch the ROWID from the Dealers table
        const dealerQuery = `SELECT ROWID FROM Dealers WHERE email = '${email}'`;
        const dealerQueryResp = await zcql
          .executeZCQLQuery(dealerQuery)
          .catch(() => null);

        if (dealerQueryResp == null || dealerQueryResp.length === 0) {
          console.log("Dealer not found.");
          return res.status(404).json({ error: "Dealer not found" });
        }

        const dealer = dealerQueryResp[0];
        dealerId = dealer.Dealers.ROWID; // Set the dealerId

        // Attach dealer details to the request object
        req.user = {
          userId: userId,
          dealerId: dealerId,
          role: "DEALER",
          email: user.Users.email,
          userName: user.Users.name || "User",
        };
      } else if (role === "TECHNICIAN") {
        // Fetch the ROWID from the Technicians table
        const technicianQuery = `SELECT ROWID, DealerID FROM Technicians WHERE email = '${email}'`;
        const technicianQueryResp = await zcql
          .executeZCQLQuery(technicianQuery)
          .catch(() => null);

        if (technicianQueryResp == null || technicianQueryResp.length === 0) {
          console.log("Technician not found.");
          return res.status(404).json({ error: "Technician not found" });
        }

        const technician = technicianQueryResp[0];
        technicianId = technician.Technicians.ROWID; // Set the technicianId
        dealerId = technician.Technicians.DealerID; // Set the dealerId associated with the technician

        // Attach technician details to the request object
        req.user = {
          userId: userId,
          technicianId: technicianId,
          dealerId: dealerId,
          role: "TECHNICIAN",
          email: user.Users.email,
          userName: user.Users.name || "User",
        };
      } else if (role === "ADMIN") {
        // Handle the ADMIN role
        req.user = {
          userId: userId,
          role: "ADMIN",
          email: user.Users.email,
          userName: user.Users.name || "Admin",
        };
      } else {
        console.log("Invalid role provided.");
        return res.status(400).json({ error: "Invalid role" });
      }
    } else {
      // If the role is not set, treat as an undefined role
      console.log("Role not provided.");
      return res.status(400).json({ error: "Role not provided" });
    }

    console.log(`User authenticated: ${user.Users.name}`);
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error("User validation failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = validateUser;
