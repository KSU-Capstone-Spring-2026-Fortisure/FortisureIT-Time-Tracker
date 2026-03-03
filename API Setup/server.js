const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let contracts = [
  { id: 1, name: "Team Creation Portal" },
  { id: 2, name: "Upload Refactor" }
];

// Test route
app.get("/", (req, res) => {
  res.send("Project Tracker API Running");
});

// Get contracts
app.get("/contracts", (req, res) => {
  res.json(contracts);
});

// Add contract
app.post("/contracts", (req, res) => {
  const newContract = { id: Date.now(), ...req.body };
  contracts.push(newContract);
  res.json(newContract);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));