// Initialisation Sentry côté serveur (Nitro) — envoie vers GlitchTip.
// Chargé très tôt via --import, donc on lit process.env directement
// (useRuntimeConfig() n'est pas fiable à ce stade).
import * as Sentry from "@sentry/nuxt";

const dsn
  = process.env.SENTRY_DSN
    || process.env.NUXT_PUBLIC_SENTRY_DSN
    || "";

// Récupère le code HTTP porté par une erreur (H3Error de `createError`,
// FetchError de $fetch, etc.), quel que soit le champ utilisé.
function getStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as {
    statusCode?: unknown;
    status?: unknown;
    response?: { status?: unknown };
  };
  const candidates = [e.statusCode, e.status, e.response?.status];
  for (const c of candidates) {
    if (typeof c === "number") return c;
  }
  return undefined;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT
      || process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT
      || process.env.NODE_ENV
      || "development",

    tracesSampleRate: 0.01,
    sendDefaultPii: false,

    // Ne pas remonter les erreurs "client" (4xx) : un 401 renvoyé par le
    // middleware d'auth, un 403 "Accès non autorisé", un 404… sont des
    // comportements normaux, pas des anomalies. Les 5xx passent toujours.
    beforeSend(event, hint) {
      const status = getStatusCode(hint.originalException);
      if (status !== undefined && status >= 400 && status < 500) {
        return null;
      }
      return event;
    },
  });
}
