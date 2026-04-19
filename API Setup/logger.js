const pool = require("./db/pool");

async function writeLog(level, message, stack, route) {
  try {
    await pool.query(
      `INSERT INTO logs (level, message, stack_trace, route)
       VALUES ($1, $2, $3, $4)`,
      [level, message, stack, route]
    );
  } catch (err) {
    console.error(`Failed to write ${level} log:`, err.message);
  }
}

function logError({ message, stack, route }) {
  return writeLog("error", message, stack, route);
}

function logInfo(message, route = null) {
  return writeLog("info", message, null, route);
}

module.exports = { logError, logInfo };
