require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Normalize empty values to NULL
function normalize(v) {
  return v === "" || v === undefined ? null : v;
}

// PostgreSQL Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

// Helper to run queries
async function runQuery(res, sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Project Tracker API Running");
});

// GET ROUTES
app.get("/users", (req, res) => runQuery(res, "SELECT * FROM users"));
app.get("/clients", (req, res) => runQuery(res, "SELECT * FROM clients"));
app.get("/contracts", (req, res) =>
  runQuery(res, "SELECT * FROM contracts WHERE is_deleted IS NOT TRUE")
);
app.get("/milestones", (req, res) =>
  runQuery(res, "SELECT * FROM contract_milestones WHERE is_deleted IS NOT TRUE")
);
app.get("/hours", (req, res) =>
  runQuery(res, "SELECT * FROM hourly_entries WHERE is_deleted IS NOT TRUE")
);

// Only return open (not completed) requests
app.get("/requests", (req, res) =>
  runQuery(
    res,
    `SELECT * FROM bug_feature_requests 
     WHERE completed = false 
     ORDER BY modified_date DESC`
  )
);

// CREATE ROUTES
app.post("/contracts", (req, res) => {
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
    ]
  );
});

app.post("/milestones", (req, res) => {
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
    ]
  );
});

app.post("/hours", (req, res) => {
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
    ]
  );
});

app.post("/requests", (req, res) => {
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
    ]
  );
});

// UPDATE ROUTES
app.put("/contracts/:id", (req, res) => {
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
    ]
  );
});

app.put("/hours/:id", (req, res) => {
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
    ]
  );
});

app.put("/hours/:id/submit", (req, res) => {
  runQuery(
    res,
    `UPDATE hourly_entries
     SET is_submitted = true
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );
});

app.put("/milestones/:id", (req, res) => {
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
    ]
  );
});

app.put("/requests/:id", (req, res) => {
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
    ]
  );
});

// Mark as complete
app.put("/requests/:id/complete", (req, res) => {
  runQuery(
    res,
    `UPDATE bug_feature_requests
     SET completed = true,
         modified_date = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );
});

// SOFT DELETE ROUTES
app.put("/contracts/:id/delete", (req, res) =>
  runQuery(
    res,
    `UPDATE contracts SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id]
  )
);

app.put("/hours/:id/delete", (req, res) =>
  runQuery(
    res,
    `UPDATE hourly_entries SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id]
  )
);

app.put("/milestones/:id/delete", (req, res) =>
  runQuery(
    res,
    `UPDATE contract_milestones SET is_deleted=true WHERE id=$1 RETURNING *`,
    [req.params.id]
  )
);

// SUBMISSIONS
app.post("/submissions", (req, res) => {
  const { user_id } = req.body;

  runQuery(
    res,
    `INSERT INTO hourly_submissions (user_id)
     VALUES ($1)
     RETURNING *`,
    [user_id]
  );
});

app.post("/submission-items", (req, res) => {
  const { submission_id, hourly_entry_id } = req.body;

  runQuery(
    res,
    `INSERT INTO hourly_submission_items(submission_id, hourly_entry_id)
     VALUES ($1,$2)
     RETURNING *`,
    [submission_id, hourly_entry_id]
  );
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});