const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");

const router = express.Router();

router.get("/clients", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const params = [];
  const where = ["c.is_deleted IS NOT TRUE", "c.is_active IS TRUE"];
  let limitClause = "";

  // Temporary client visibility rule until Microsoft auth and full access mapping are wired up.
  if (["hourly", "employee", "contractor"].includes(viewerRole)) {
    limitClause = "LIMIT 3";
  } else if (viewerRole === "manager") {
    limitClause = "LIMIT 5";
  }

  try {
    const result = await pool.query(
      `SELECT c.*
       FROM clients c
       WHERE ${where.join(" AND ")}
       ORDER BY c.id ASC
       ${limitClause}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    logError({
      message: err.message,
      stack: err.stack,
      route: "/clients",
    });

    res.status(500).json({
      error: err.message,
      detail: err.detail || null,
      hint: err.hint || null,
    });
  }
});

module.exports = router;
