const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");

const router = express.Router();

function sendError(res, err, route) {
  logError({
    message: err.message,
    stack: err.stack,
    route,
  });

  res.status(500).json({
    error: err.message,
    detail: err.detail || null,
    hint: err.hint || null,
  });
}

router.post("/submissions", async (req, res) => {
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO hourly_submissions (user_id, submitted_at, is_deleted)
       VALUES ($1, NOW(), false)
       RETURNING *`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/submissions (POST)");
  }
});

router.post("/submission-items", async (req, res) => {
  const { submission_id, hourly_entry_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO hourly_submission_items (submission_id, hourly_entry_id, is_deleted)
       VALUES ($1, $2, false)
       RETURNING *`,
      [submission_id, hourly_entry_id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/submission-items (POST)");
  }
});

module.exports = router;
