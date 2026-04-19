const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { logError } = require("./logger");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/", routes);

app.use((err, req, res, next) => {
  logError({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
  });

  console.error("Unhandled API Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: err.message,
    detail: err.detail || null,
    hint: err.hint || null,
  });
});

module.exports = app;
