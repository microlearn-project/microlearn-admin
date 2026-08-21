// server/api/auth/profile.patch.ts
// /auth/me (PATCH) est ouvert à tout rôle authentifié et auto-scopé au
// token — contrairement à /agents/:id/profile (réservé SUPERADMIN/ADMIN).
import { callApi } from "~~/server/utils/apiBridge";
import { requireSession } from "~~/server/utils/keycloakAuth";

export default defineEventHandler(async (event) => {
  requireSession(event);
  const { nom, prenom, email } = await readBody(event);

  return callApi(event, `/auth/me`, {
    method: "PATCH",
    body: { nom, prenom, email },
  });
});
