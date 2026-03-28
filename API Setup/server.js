require("dotenv").config();
const { Pool } = require("pg");
//Connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // required for Azure PostgreSQL
  },
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL!"))
  .catch(err => {
  console.error("Connection error:", err.message);
});


const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/contracts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contracts");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Project Tracker API Running");
});



// Add contract
app.post("/contracts", (req, res) => {
  const newContract = { id: Date.now(), ...req.body };
  contracts.push(newContract);
  res.json(newContract);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));