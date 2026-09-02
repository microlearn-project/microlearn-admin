// Initialisation Sentry côté serveur (Nitro) — envoie vers GlitchTip.
// Chargé très tôt via --import, donc on lit process.env directement
// (useRuntimeConfig() n'est pas fiable à ce stade).
import * as Sentry from "@sentry/nuxt";

const dsn
  = process.env.SENTRY_DSN
    || process.env.NUXT_PUBLIC_SENTRY_DSN
    || "";

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
  });
}
