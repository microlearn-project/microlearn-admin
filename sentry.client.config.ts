// Initialisation Sentry côté navigateur (Vue) — envoie vers GlitchTip.
// Chargé automatiquement par @sentry/nuxt.
import * as Sentry from "@sentry/nuxt";

const config = useRuntimeConfig();
const dsn = config.public.sentry.dsn;

if (dsn) {
  Sentry.init({
    dsn,
    environment: config.public.sentry.environment,

    // Le module @sentry/nuxt câble déjà le routeur Nuxt pour le tracing.
    // GlitchTip supporte le tracing basique — on échantillonne bas.
    tracesSampleRate: 0.01,

    // GlitchTip ne traite pas Session Replay ni Profiling : on ne les active pas.

    // Ne pas joindre les données personnelles identifiables (IP, cookies…).
    sendDefaultPii: false,
  });
}
