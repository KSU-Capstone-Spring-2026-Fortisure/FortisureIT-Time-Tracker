require("dotenv").config();
const app = require("./app");
const pool = require("./db/pool");

const PORT = process.env.PORT || 3000;

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection ready.");
  } catch (err) {
    console.error("Database connection check failed during startup:", err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer();
