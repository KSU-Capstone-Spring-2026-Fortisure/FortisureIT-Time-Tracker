const pool = require("../db/pool");
const { logError } = require("../logger");

async function runQuery(res, sql, params = [], route = null) {
  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);

    logError({
      message: err.message,
      stack: err.stack,
      route,
    });

    res.status(500).json({
      error: err.message,
      detail: err.detail || null,
      hint: err.hint || null,
    });
  }
}

module.exports = { runQuery };
