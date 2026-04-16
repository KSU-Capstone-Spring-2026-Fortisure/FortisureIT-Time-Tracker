const express = require("express");
const { runQuery } = require("../utils/runQuery");
const { normalize } = require("../utils/normalize");

const router = express.Router();

router.get("/hours", (req, res) => {
  runQuery(
    res,
    "SELECT * FROM hourly_entries WHERE is_deleted IS NOT TRUE",
    [],
    "/hours"
  );
});

router.post("/hours", (req, res) => {
  const { user_id, client_id, work_date, hours_worked, notes, is_billable } =
    req.body;

  runQuery(
    res,
    `INSERT INTO hourly_entries(user_id, client_id, work_date, hours_worked, notes, is_billable)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      user_id,
      client_id,
      normalize(work_date),
      normalize(hours_worked),
      normalize(notes),
      normalize(is_billable),
    ],
    "/hours (POST)"
  );
});

router.put("/hours/:id", (req, res) => {
  const { work_date, hours_worked, notes, is_billable } = req.body;

  runQuery(
    res,
    `UPDATE hourly_entries
     SET work_date=$1, hours_worked=$2, notes=$3, is_billable=$4
     WHERE id=$5
     RETURNING *`,
    [
      normalize(work_date),
      normalize(hours_worked),
      normalize(notes),
      normalize(is_billable),
      req.params.id,
    ],
    "/hours/:id (PUT)"
  );
});

router.put("/hours/:id/submit", (req, res) => {
  runQuery(
    res,
    `UPDATE hourly_entries
     SET is_submitted = true
     WHERE id = $1
     RETURNING *`,
    [req.params.id],
    "/hours/:id/submit (PUT)"
  );
});

router.put("/hours/:id/delete", (req, res) => {
  runQuery(
    res,
    `UPDATE hourly_entries SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id],
    "/hours/:id/delete (PUT)"
  );
});

module.exports = router;