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

router.get("/hours", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const viewerUserId = Number(req.query.viewer_user_id) || null;
  const clientId = Number(req.query.client_id) || null;
  const weekStart = req.query.week_start;
  const weekEnd = req.query.week_end;
  const params = [];
  const where = ["h.is_deleted IS NOT TRUE"];

  if (clientId) {
    params.push(clientId);
    where.push(`h.client_id = $${params.length}`);
  }

  if (weekStart) {
    params.push(weekStart);
    where.push(`h.work_date >= $${params.length}`);
  }

  if (weekEnd) {
    params.push(weekEnd);
    where.push(`h.work_date <= $${params.length}`);
  }

  if (viewerRole === "manager") {
    params.push(viewerUserId);
    where.push(`(
      h.user_id = $${params.length}
      OR EXISTS (
        SELECT 1
        FROM users managed
        WHERE managed.id = h.user_id
          AND managed.manager_user_id = $${params.length}
          AND managed.is_deleted IS NOT TRUE
      )
    )`);
  } else if (viewerRole !== "admin") {
    params.push(viewerUserId);
    where.push(`h.user_id = $${params.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT
         h.*,
         u.full_name AS user_name,
         c.client_name
       FROM hourly_entries h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN clients c ON c.id = h.client_id
       WHERE ${where.join(" AND ")}
       ORDER BY h.updated_at DESC NULLS LAST, h.id DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/hours");
  }
});

router.post("/hours", async (req, res) => {
  const { user_id, client_id, work_date, hours_worked, notes, is_billable } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO hourly_entries (
         user_id,
         client_id,
         work_date,
         hours_worked,
         notes,
         is_billable,
         is_submitted,
         status,
         created_at,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,false,'draft',NOW(),NOW())
       RETURNING *`,
      [
        user_id,
        client_id,
        normalize(work_date),
        normalize(hours_worked),
        normalize(notes),
        normalize(is_billable),
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/hours (POST)");
  }
});

router.put("/hours/:id", async (req, res) => {
  const { work_date, hours_worked, notes, is_billable } = req.body;

  try {
    const result = await pool.query(
      `UPDATE hourly_entries
       SET work_date = $1,
           hours_worked = $2,
           notes = $3,
           is_billable = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        normalize(work_date),
        normalize(hours_worked),
        normalize(notes),
        normalize(is_billable),
        req.params.id,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/hours/:id (PUT)");
  }
});

router.put("/hours/:id/submit", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE hourly_entries
       SET is_submitted = true,
           status = 'submitted',
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
    sendError(res, err, "/hours/:id/submit (PUT)");
  }
});

router.put("/hours/:id/review", async (req, res) => {
  const { status, reviewer_id, rejection_note } = req.body;

  try {
    const result = await pool.query(
      `UPDATE hourly_entries
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           rejection_note = $3,
           is_submitted = CASE WHEN $1 = 'rejected' THEN false ELSE true END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewer_id, normalize(rejection_note), req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/hours/:id/review (PUT)");
  }
});

router.put("/hours/:id/delete", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE hourly_entries
       SET is_deleted = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/hours/:id/delete (PUT)");
  }
});

module.exports = router;
