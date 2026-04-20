import { app, authentication } from "@microsoft/teams-js";

function getTeamsIdentity(context) {
  const user = context?.user || null;
  const loginHint = String(
    user?.loginHint || user?.userPrincipalName || user?.email || ""
  )
    .trim()
    .toLowerCase();

  return {
    ...user,
    loginHint,
    email: loginHint,
  };
}

export async function initializeTeams() {
  try {
    await app.initialize();
    const context = await app.getContext();

    let authToken = null;
    let authError = null;

    try {
      authToken = await authentication.getAuthToken();
    } catch (error) {
      authError = String(error?.message || error || "");
    }

    return {
      inTeams: true,
      context,
      user: getTeamsIdentity(context),
      authToken,
      authError,
    };
  } catch {
    return {
      inTeams: false,
      context: null,
      user: null,
      authToken: null,
      authError: null,
    };
  }
}
