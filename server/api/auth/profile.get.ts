// server/api/auth/profile.get.ts
// /auth/me est ouvert à tout rôle authentifié et auto-scopé au token —
// contrairement à /agents/:id (réservé SUPERADMIN/ADMIN), il fonctionne
// aussi pour un FORMATEUR consultant son propre profil.
import { callApi } from "~~/server/utils/apiBridge";
import { requireSession } from "~~/server/utils/keycloakAuth";

export default defineEventHandler((event) => {
  requireSession(event);
  return callApi(event, `/auth/me`);
});
