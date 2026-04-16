const express = require("express");
const { runQuery } = require("../utils/runQuery");

const router = express.Router();

router.get("/clients", (req, res) => {
  runQuery(res, "SELECT * FROM clients", [], "/clients");
});

module.exports = router;