const express = require("express");
const usersRoutes = require("./users");
const clientsRoutes = require("./clients");
const contractsRoutes = require("./contracts");
const milestonesRoutes = require("./milestones");
const hoursRoutes = require("./hours");
const requestsRoutes = require("./requests");
const submissionsRoutes = require("./submissions");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Project Tracker API Running");
});

// router.use(usersRoutes);
// router.use(clientsRoutes);
router.use(contractsRoutes);
// router.use(milestonesRoutes);
// router.use(hoursRoutes);
// router.use(requestsRoutes);
// router.use(submissionsRoutes);

module.exports = router;