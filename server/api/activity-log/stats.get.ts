// server/api/activity-log/stats.get.ts
// Interrogeait encore directement l'ancienne base Supabase (jamais migré) —
// les cartes "Total/Aujourd'hui/Connexions/Action fréquente" de
// activitylogs.vue affichaient des chiffres sans rapport avec les vraies
// données. GET /activity-log/stats (API) calcule tout via Prisma.
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/activity-log/stats");
});
