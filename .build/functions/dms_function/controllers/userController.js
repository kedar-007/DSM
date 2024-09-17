// controller/userController.js
const catalyst = require('zcatalyst-sdk-node');

exports.getUserDetails = async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const userManagement = capp.userManagement();
    const userDetails = await userManagement.getCurrentUser();
    res.status(200).json(userDetails);
  } catch (error) {
    console.error('Failed to get user details:', error);
    res.status(500).json({ error: error.message });
  }
};
