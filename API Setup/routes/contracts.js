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

router.get("/contracts", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const viewerUserId = Number(req.query.viewer_user_id) || null;
  const clientId = Number(req.query.client_id) || null;
  const weekStart = req.query.week_start;
  const weekEnd = req.query.week_end;
  const params = [];
  const where = ["c.is_deleted IS NOT TRUE"];

  if (clientId) {
    params.push(clientId);
    where.push(`c.client_id = $${params.length}`);
  }

  if (weekStart) {
    params.push(weekStart);
    where.push(`COALESCE(c.end_date, c.start_date) >= $${params.length}`);
  }

  if (weekEnd) {
    params.push(weekEnd);
    where.push(`c.start_date <= $${params.length}`);
  }

  if (viewerRole !== "admin") {
    params.push(viewerUserId);
    where.push(`EXISTS (
      SELECT 1
      FROM user_client_access viewer_access
      WHERE viewer_access.client_id = c.client_id
        AND viewer_access.user_id = $${params.length}
        AND viewer_access.is_deleted IS NOT TRUE
    )`);
  }

  if (viewerRole === "manager") {
    params.push(viewerUserId);
    where.push(`(
      c.created_by = $${params.length}
      OR EXISTS (
        SELECT 1
        FROM users managed
        WHERE managed.id = c.created_by
          AND managed.manager_user_id = $${params.length}
          AND managed.is_deleted IS NOT TRUE
      )
    )`);
  } else if (viewerRole !== "admin") {
    params.push(viewerUserId);
    where.push(`c.created_by = $${params.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT
         c.*,
         u.full_name AS created_by_name,
         cl.client_name
       FROM contracts c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN clients cl ON cl.id = c.client_id
       WHERE ${where.join(" AND ")}
       ORDER BY c.updated_at DESC NULLS LAST, c.id DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts");
  }
});

router.post("/contracts", async (req, res) => {
  const {
    client_id,
    contract_name,
    description,
    start_date,
    end_date,
    total_value,
    created_by,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO contracts (
         client_id,
         contract_name,
         description,
         start_date,
         end_date,
         total_value,
         created_by,
         status,
         created_at,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',NOW(),NOW())
       RETURNING *`,
      [
        client_id,
        normalize(contract_name),
        normalize(description),
        normalize(start_date),
        normalize(end_date),
        normalize(total_value),
        created_by,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts (POST)");
  }
});

router.put("/contracts/:id", async (req, res) => {
  const { contract_name, description, start_date, end_date, total_value } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contracts
       SET contract_name = $1,
           description = $2,
           start_date = $3,
           end_date = $4,
           total_value = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        normalize(contract_name),
        normalize(description),
        normalize(start_date),
        normalize(end_date),
        normalize(total_value),
        req.params.id,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts/:id (PUT)");
  }
});

router.put("/contracts/:id/submit", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE contracts
       SET status = 'submitted',
           is_approved = false,
           is_rejected = false,
           submitted_at = NOW(),
           reviewed_at = NULL,
           reviewed_by = NULL,
           rejection_note = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts/:id/submit (PUT)");
  }
});

router.put("/contracts/:id/review", async (req, res) => {
  const { status, reviewer_id, rejection_note } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contracts
       SET status = $1::varchar,
           reviewed_by = $2,
           reviewed_at = NOW(),
           rejection_note = $3,
           is_approved = CASE WHEN $1::varchar = 'approved' THEN true ELSE false END,
           is_rejected = CASE WHEN $1::varchar = 'rejected' THEN true ELSE false END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewer_id, normalize(rejection_note), req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts/:id/review (PUT)");
  }
});

router.put("/contracts/:id/delete", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE contracts
       SET is_deleted = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/contracts/:id/delete (PUT)");
  }
});

module.exports = router;
