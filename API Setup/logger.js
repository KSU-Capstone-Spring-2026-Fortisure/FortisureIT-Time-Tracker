// logger.js
const { pool } = require("./server").pool;

async function logError({ message, stack, route }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, message, stack_trace, route)
       VALUES ($1, $2, $3, $4)`,
      ["error", message, stack, route]
    );
  } catch (err) {
    console.error("Failed to write log:", err.message);
  }
}

async function logInfo(message, route = null) {
  try {
    await pool.query(
      `INSERT INTO logs (level, message, route)
       VALUES ($1, $2, $3)`,
      ["info", message, route]
    );
  } catch (err) {
    console.error("Failed to write info log:", err.message);
  }
}

module.exports = { logError, logInfo };