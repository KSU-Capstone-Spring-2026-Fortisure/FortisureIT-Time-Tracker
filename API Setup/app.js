const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { logError } = require("./logger");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", routes);

// Global error handler
app.use(async (err, req, res, next) => {
  await logError({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
  });

  console.error("Unhandled API Error:", err);

  res.status(500).json({
    error: err.message,
    detail: err.detail || null,
    hint: err.hint || null,
  });
});

module.exports = app;