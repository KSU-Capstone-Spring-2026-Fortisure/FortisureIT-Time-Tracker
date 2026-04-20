const crypto = require("crypto");

const OPENID_KEYS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

let jwksCache = {
  expiresAt: 0,
  keys: [],
};

function createAuthError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function base64UrlToBuffer(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function decodeJwtPart(value) {
  try {
    return JSON.parse(base64UrlToBuffer(value).toString("utf8"));
  } catch {
    throw createAuthError(401, "Unable to decode the Teams access token.");
  }
}

function getConfiguredAudiences() {
  return [
    process.env.TEAMS_ENTRA_CLIENT_ID,
    process.env.TEAMS_CLIENT_ID,
    process.env.MICROSOFT_APP_ID,
  ].filter(Boolean);
}

async function getMicrosoftSigningKeys() {
  if (jwksCache.expiresAt > Date.now() && jwksCache.keys.length > 0) {
    return jwksCache.keys;
  }

  const response = await fetch(OPENID_KEYS_URL);
  if (!response.ok) {
    throw createAuthError(503, `Unable to load Microsoft signing keys (${response.status}).`);
  }

  const payload = await response.json();
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];

  if (keys.length === 0) {
    throw createAuthError(503, "Microsoft signing keys response was empty.");
  }

  jwksCache = {
    keys,
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
  };

  return keys;
}

function getSigningKey(header, keys) {
  const key = keys.find((candidate) => candidate.kid === header.kid);
  if (!key) {
    throw createAuthError(401, "The Teams access token signing key was not recognized.");
  }

  return crypto.createPublicKey({ key, format: "jwk" });
}

function validateTokenClaims(payload, audiences) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const issuer = String(payload?.iss || "");
  const audience = String(payload?.aud || "");
  const scope = String(payload?.scp || "");

  if (!/^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]+\/v2\.0$/i.test(issuer)) {
    throw createAuthError(401, "The Teams access token issuer is invalid.");
  }

  if (!audiences.includes(audience)) {
    throw createAuthError(401, "The Teams access token audience is invalid.");
  }

  if (payload?.nbf && Number(payload.nbf) > nowInSeconds + 60) {
    throw createAuthError(401, "The Teams access token is not valid yet.");
  }

  if (!payload?.exp || Number(payload.exp) <= nowInSeconds) {
    throw createAuthError(401, "The Teams access token has expired.");
  }

  if (scope && !scope.split(" ").includes("access_as_user")) {
    throw createAuthError(401, "The Teams access token is missing the expected scope.");
  }
}

async function verifyTeamsAccessToken(token) {
  const audiences = getConfiguredAudiences();
  if (audiences.length === 0) {
    throw createAuthError(
      503,
      "Teams SSO is not configured on the server. Set TEAMS_ENTRA_CLIENT_ID before enabling verified sign-in."
    );
  }

  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw createAuthError(401, "The Teams access token format is invalid.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw createAuthError(401, "The Teams access token signing algorithm is invalid.");
  }

  const keys = await getMicrosoftSigningKeys();
  const signingKey = getSigningKey(header, keys);
  const signature = base64UrlToBuffer(encodedSignature);
  const signedContent = Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8");

  const isSignatureValid = crypto.verify("RSA-SHA256", signedContent, signingKey, signature);
  if (!isSignatureValid) {
    throw createAuthError(401, "The Teams access token signature is invalid.");
  }

  validateTokenClaims(payload, audiences);

  return payload;
}

function extractBearerToken(req) {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

function extractIdentityHint(req) {
  return String(req.headers["x-teams-login-hint"] || req.headers["x-teams-upn"] || "")
    .trim()
    .toLowerCase();
}

module.exports = {
  createAuthError,
  extractBearerToken,
  extractIdentityHint,
  verifyTeamsAccessToken,
};
