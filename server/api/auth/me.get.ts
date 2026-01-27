// server/api/auth/me.get.ts
import { getUserSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    return {
      authenticated: false,
      user: null,
    };
  }

  return {
    authenticated: true,
    user: session.user,
    loggedInAt: session.loggedInAt,
    expiresAt: session.expiresAt,
  };
});
