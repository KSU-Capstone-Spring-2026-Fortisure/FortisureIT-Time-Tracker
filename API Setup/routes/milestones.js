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

  res.status(err.status || 500).json({
    error: err.message,
    detail: err.detail || null,
    hint: err.hint || null,
  });
}

async function getContractContext(contractId, milestoneIdToExclude = null) {
  const result = await pool.query(
    `SELECT
       c.id,
       c.client_id,
       c.created_by,
       c.status,
       c.total_value,
       COALESCE(
         SUM(
           CASE
             WHEN m.is_deleted IS NOT TRUE AND ($2::int IS NULL OR m.id <> $2)
               THEN COALESCE(m.amount, 0)
             ELSE 0
           END
         ),
         0
       ) AS existing_milestone_total
     FROM contracts c
     LEFT JOIN contract_milestones m ON m.contract_id = c.id
     WHERE c.id = $1
       AND c.is_deleted IS NOT TRUE
     GROUP BY c.id`,
    [contractId, milestoneIdToExclude]
  );

  return result.rows[0] || null;
}

function normalizeContractStatus(status) {
  return String(status || "draft").toLowerCase();
}

function ensureContractAllowsMilestoneMutation(contractContext) {
  if (!contractContext) {
    const error = new Error("The associated contract could not be found.");
    error.status = 404;
    throw error;
  }

  if (["submitted", "approved"].includes(normalizeContractStatus(contractContext.status))) {
    const error = new Error("Milestones cannot be edited once the contract has been submitted.");
    error.status = 400;
    throw error;
  }
}

function ensureMilestoneTotalWithinContract(contractContext, nextAmount) {
  const contractLimit = Number(contractContext.total_value || 0);
  const existingTotal = Number(contractContext.existing_milestone_total || 0);
  const proposedAmount = Number(nextAmount || 0);

  if (existingTotal + proposedAmount > contractLimit) {
    const error = new Error("Milestone totals cannot be greater than the contract total value.");
    error.status = 400;
    throw error;
  }
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
         c.created_by,
         c.status AS contract_status,
         c.total_value AS contract_total_value
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
    const contractContext = await getContractContext(contract_id);
    ensureContractAllowsMilestoneMutation(contractContext);
    ensureMilestoneTotalWithinContract(contractContext, amount);

    const result = await pool.query(
      `INSERT INTO contract_milestones(
         contract_id,
         milestone_name,
         description,
         due_date,
         amount,
         status,
         created_at,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,'open',NOW(),NOW())
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
  const { contract_id, milestone_name, description, due_date, amount } = req.body;

  try {
    const contractContext = await getContractContext(contract_id, req.params.id);
    ensureContractAllowsMilestoneMutation(contractContext);
    ensureMilestoneTotalWithinContract(contractContext, amount);

    const result = await pool.query(
      `UPDATE contract_milestones
       SET milestone_name = $1,
           description = $2,
           due_date = $3,
           amount = $4,
           updated_at = NOW()
       WHERE id = $5
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

router.put("/milestones/:id/review", async (req, res) => {
  const { status, reviewer_id, rejection_note } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contract_milestones
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           rejection_note = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewer_id, normalize(rejection_note), req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones/:id/review (PUT)");
  }
});

router.put("/milestones/:id/delete", async (req, res) => {
  try {
    const milestoneResult = await pool.query(
      `SELECT contract_id
       FROM contract_milestones
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    const contractContext = await getContractContext(milestoneResult.rows[0]?.contract_id, req.params.id);
    ensureContractAllowsMilestoneMutation(contractContext);

    const result = await pool.query(
      `UPDATE contract_milestones
       SET is_deleted = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    sendError(res, err, "/milestones/:id/delete (PUT)");
  }
});

module.exports = router;
