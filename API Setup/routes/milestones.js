const express = require("express");
const { runQuery } = require("../utils/runQuery");
const { normalize } = require("../utils/normalize");

const router = express.Router();

router.get("/milestones", (req, res) => {
  runQuery(
    res,
    "SELECT * FROM contract_milestones WHERE is_deleted IS NOT TRUE",
    [],
    "/milestones"
  );
});

router.post("/milestones", (req, res) => {
  const { contract_id, milestone_name, description, due_date, amount } =
    req.body;

  runQuery(
    res,
    `INSERT INTO contract_milestones(contract_id, milestone_name, description, due_date, amount)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      contract_id,
      normalize(milestone_name),
      normalize(description),
      normalize(due_date),
      normalize(amount),
    ],
    "/milestones (POST)"
  );
});

router.put("/milestones/:id", (req, res) => {
  const { milestone_name, description, due_date, amount } = req.body;

  runQuery(
    res,
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
    ],
    "/milestones/:id (PUT)"
  );
});

router.put("/milestones/:id/delete", (req, res) => {
  runQuery(
    res,
    `UPDATE contract_milestones SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id],
    "/milestones/:id/delete (PUT)"
  );
});

module.exports = router;