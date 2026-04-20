const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");

const router = express.Router();

router.get("/clients", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const viewerUserId = Number(req.query.viewer_user_id) || null;

  try {
    const result = await pool.query(
      `SELECT DISTINCT c.*
       FROM clients c
       LEFT JOIN user_client_access uca
         ON uca.client_id = c.id
        AND uca.is_deleted IS NOT TRUE
       WHERE c.is_deleted IS NOT TRUE
         AND c.is_active IS TRUE
         AND (
           $1 = 'admin'
           OR uca.user_id = $2
         )
       ORDER BY c.client_name ASC`,
      [viewerRole, viewerUserId]
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
