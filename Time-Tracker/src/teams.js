import { app } from "@microsoft/teams-js";

export async function initializeTeams() {
  try {
    await app.initialize();
    const context = await app.getContext();

    return {
      inTeams: true,
      context,
    };
  } catch (err) {
    return {
      inTeams: false,
      context: null,
    };
  }
}