const express = require("express");
const pool = require("../db/pool");
const { normalize } = require("../utils/normalize");
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

router.get("/requests", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.*,
         u.full_name AS submitted_by_name
       FROM bug_feature_requests r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.is_deleted IS NOT TRUE
       ORDER BY r.completed ASC, r.modified_date DESC, r.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/requests");
  }
});

router.post("/requests", async (req, res) => {
  const { user_id, request_type, title, severity, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO bug_feature_requests (
         user_id,
         request_type,
         title,
         severity,
         description,
         status,
         created_at,
         modified_date,
         completed
       )
       VALUES ($1,$2,$3,$4,$5,'Open',NOW(),NOW(),false)
       RETURNING *`,
      [
        user_id,
        request_type,
        normalize(title),
        normalize(severity),
        normalize(description),
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/requests (POST)");
  }
});

router.put("/requests/:id", async (req, res) => {
  const { title, severity, description, viewer_user_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE bug_feature_requests
       SET title = $1,
           severity = $2,
           description = $3,
           modified_date = NOW()
       WHERE id = $4
         AND user_id = $5
       RETURNING *`,
      [
        normalize(title),
        normalize(severity),
        normalize(description),
        req.params.id,
        viewer_user_id,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/requests/:id (PUT)");
  }
});

router.put("/requests/:id/complete", async (req, res) => {
  const { completed_by } = req.body;

  try {
    const result = await pool.query(
      `UPDATE bug_feature_requests
       SET completed = true,
           status = 'Complete',
           completed_by = $1,
           modified_date = NOW()
       WHERE id = $2
       RETURNING *`,
      [completed_by, req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/requests/:id/complete (PUT)");
  }
});

module.exports = router;
