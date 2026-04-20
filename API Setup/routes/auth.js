const express = require("express");
const pool = require("../db/pool");
const { logError } = require("../logger");
const {
  createAuthError,
  extractBearerToken,
  extractIdentityHint,
  verifyTeamsAccessToken,
} = require("../utils/teamsAuth");

const router = express.Router();

async function findActiveUserByEmail(email) {
  const result = await pool.query(
    `SELECT
       u.id,
       u.user_uuid,
       u.role_id,
       u.manager_user_id,
       u.full_name,
       u.email,
       u.is_active,
       u.is_deleted,
       r.role_name
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = LOWER($1)
       AND u.is_deleted IS NOT TRUE
       AND u.is_active IS TRUE
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
}

router.get("/auth/me", async (req, res) => {
  try {
    const bearerToken = extractBearerToken(req);

    let authMode = null;
    let verified = false;
    let identityEmail = null;

    if (bearerToken) {
      const tokenPayload = await verifyTeamsAccessToken(bearerToken);
      identityEmail = String(
        tokenPayload.preferred_username || tokenPayload.upn || tokenPayload.unique_name || ""
      )
        .trim()
        .toLowerCase();
      authMode = "teams_sso";
      verified = true;
    } else {
      identityEmail = extractIdentityHint(req);

      if (!identityEmail) {
        throw createAuthError(401, "No Teams identity was provided.");
      }

      authMode = "teams_sdk_email";
      verified = false;
    }

    if (!identityEmail) {
      throw createAuthError(401, "The Teams identity did not include an email address.");
    }

    const user = await findActiveUserByEmail(identityEmail);
    if (!user) {
      return res.status(403).json({
        error: "You do not have access to this app. Please contact your administrator.",
        identity_email: identityEmail,
        auth_mode: authMode,
        verified,
      });
    }

    res.json({
      user,
      identity_email: identityEmail,
      auth_mode: authMode,
      verified,
    });
  } catch (err) {
    const status = err.status || 500;

    logError({
      message: err.message,
      stack: err.stack,
      route: "/auth/me",
    });

    res.status(status).json({
      error: err.message,
      detail: err.detail || null,
      hint: err.hint || null,
    });
  }
});

module.exports = router;
