export async function logTeamsUser(user) {
  if (!user) return;

  const payload = {
    teamsUserId: user.id || null,
    userPrincipalName: user.userPrincipalName || null,
    loginHint: user.loginHint || null,
    loggedAt: new Date().toISOString(),
  };

  // For now: log locally
  console.log("Teams user log:", payload);

  // Future: send to backend for storage and verification
}