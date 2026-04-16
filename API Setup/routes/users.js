const express = require("express");
const { runQuery } = require("../utils/runQuery");

const router = express.Router();

router.get("/users", (req, res) => {
  runQuery(res, "SELECT * FROM users", [], "/users");
});

module.exports = router;