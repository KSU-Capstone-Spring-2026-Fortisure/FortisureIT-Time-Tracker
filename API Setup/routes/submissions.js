const express = require("express");
const { runQuery } = require("../utils/runQuery");
const { normalize } = require("../utils/normalize");

const router = express.Router();

router.get("/requests", (req, res) => {
  runQuery(
    res,
    `SELECT * FROM bug_feature_requests 
     WHERE completed = false 
     ORDER BY modified_date DESC`,
    [],
    "/requests"
  );
});

router.post("/requests", (req, res) => {
  const { user_id, request_type, title, severity, description } = req.body;

  runQuery(
    res,
    `INSERT INTO bug_feature_requests(user_id, request_type, title, severity, description)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      user_id,
      request_type,
      normalize(title),
      normalize(severity),
      normalize(description),
    ],
    "/requests (POST)"
  );
});

router.put("/requests/:id", (req, res) => {
  const { title, severity, description } = req.body;

  runQuery(
    res,
    `UPDATE bug_feature_requests
     SET title=$1,
         severity=$2,
         description=$3,
         modified_date = NOW()
     WHERE id=$4
     RETURNING *`,
    [
      normalize(title),
      normalize(severity),
      normalize(description),
      req.params.id,
    ],
    "/requests/:id (PUT)"
  );
});

router.put("/requests/:id/complete", (req, res) => {
  runQuery(
    res,
    `UPDATE bug_feature_requests
     SET completed = true,
         modified_date = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id],
    "/requests/:id/complete (PUT)"
  );
});

module.exports = router;