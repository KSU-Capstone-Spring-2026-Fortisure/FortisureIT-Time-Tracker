const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");

const router = express.Router();

router.get("/clients", async (req, res) => {
  const viewerRole = String(req.query.viewer_role || "").toLowerCase();
  const viewerUserId = Number(req.query.viewer_user_id) || null;
  const mode = String(req.query.mode || "").toLowerCase();

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
         AND (
           $3 NOT IN ('hourly', 'contracts')
           OR $1 = 'admin'
           OR (
             $3 = 'hourly'
             AND EXISTS (
               SELECT 1
               FROM hourly_entries h
               WHERE h.client_id = c.id
                 AND h.is_deleted IS NOT TRUE
                 AND (
                   h.user_id = $2
                   OR (
                     $1 = 'manager'
                     AND EXISTS (
                       SELECT 1
                       FROM users managed
                       WHERE managed.id = h.user_id
                         AND managed.manager_user_id = $2
                         AND managed.is_deleted IS NOT TRUE
                     )
                   )
                 )
             )
           )
           OR (
             $3 = 'contracts'
             AND EXISTS (
               SELECT 1
               FROM contracts ct
               WHERE ct.client_id = c.id
                 AND ct.is_deleted IS NOT TRUE
                 AND (
                   ct.created_by = $2
                   OR (
                     $1 = 'manager'
                     AND EXISTS (
                       SELECT 1
                       FROM users managed
                       WHERE managed.id = ct.created_by
                         AND managed.manager_user_id = $2
                         AND managed.is_deleted IS NOT TRUE
                     )
                   )
                 )
             )
           )
         )
       ORDER BY c.client_name ASC`,
      [viewerRole, viewerUserId, mode]
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
