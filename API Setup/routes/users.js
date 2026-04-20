const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.user_uuid,
         u.role_id,
         u.manager_user_id,
         u.full_name,
         u.email,
         u.is_active,
         u.is_deleted,
         r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.is_deleted IS NOT TRUE
       ORDER BY u.full_name ASC`
    );

    res.json(result.rows);
  } catch (err) {
    logError({ message: err.message, stack: err.stack, route: "/users" });
    res.status(500).json({ error: err.message, detail: err.detail || null, hint: err.hint || null });
  }
});

module.exports = router;
