const express = require("express");
const { runQuery } = require("../utils/runQuery");
const { normalize } = require("../utils/normalize");

const router = express.Router();

router.get("/contracts", (req, res) => {
  runQuery(res, "SELECT * FROM contracts", [], "/contracts");
});

router.post("/contracts", (req, res) => {
  const {
    client_id,
    contract_name,
    description,
    start_date,
    end_date,
    total_value,
    created_by,
  } = req.body;

  runQuery(
    res,
    `INSERT INTO contracts(client_id, contract_name, description, start_date, end_date, total_value, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      client_id,
      normalize(contract_name),
      normalize(description),
      normalize(start_date),
      normalize(end_date),
      normalize(total_value),
      created_by,
    ],
    "/contracts (POST)"
  );
});

router.put("/contracts/:id", (req, res) => {
  const { contract_name, description, start_date, end_date, total_value } =
    req.body;

  runQuery(
    res,
    `UPDATE contracts
     SET contract_name=$1, description=$2, start_date=$3, end_date=$4, total_value=$5
     WHERE id=$6
     RETURNING *`,
    [
      normalize(contract_name),
      normalize(description),
      normalize(start_date),
      normalize(end_date),
      normalize(total_value),
      req.params.id,
    ],
    "/contracts/:id (PUT)"
  );
});

router.put("/contracts/:id/delete", (req, res) => {
  runQuery(
    res,
    `UPDATE contracts SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id],
    "/contracts/:id/delete (PUT)"
  );
});

module.exports = router;