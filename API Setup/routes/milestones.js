const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");
const { normalize } = require("../utils/normalize");

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

router.get("/milestones", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const viewerUserId = Number(req.query.viewer_user_id) || null;
  const contractId = Number(req.query.contract_id) || null;
  const params = [];
  const where = ["m.is_deleted IS NOT TRUE"];

  if (contractId) {
    params.push(contractId);
    where.push(`m.contract_id = $${params.length}`);
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
         m.*,
         c.contract_name,
         c.client_id,
         c.created_by
       FROM contract_milestones m
       LEFT JOIN contracts c ON c.id = m.contract_id
       WHERE ${where.join(" AND ")}
       ORDER BY m.due_date ASC NULLS LAST, m.id ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones");
  }
});

router.post("/milestones", async (req, res) => {
  const { contract_id, milestone_name, description, due_date, amount } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO contract_milestones(contract_id, milestone_name, description, due_date, amount)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        contract_id,
        normalize(milestone_name),
        normalize(description),
        normalize(due_date),
        normalize(amount),
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones (POST)");
  }
});

router.put("/milestones/:id", async (req, res) => {
  const { milestone_name, description, due_date, amount } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contract_milestones
       SET milestone_name=$1, description=$2, due_date=$3, amount=$4
       WHERE id=$5
       RETURNING *`,
      [
        normalize(milestone_name),
        normalize(description),
        normalize(due_date),
        normalize(amount),
        req.params.id,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones/:id (PUT)");
  }
});

router.put("/milestones/:id/delete", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE contract_milestones SET is_deleted=true WHERE id=$1 RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones/:id/delete (PUT)");
  }
});

module.exports = router;
