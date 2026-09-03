// Initialisation Sentry côté navigateur (Vue) — envoie vers GlitchTip.
// Chargé automatiquement par @sentry/nuxt.
import * as Sentry from "@sentry/nuxt";

const config = useRuntimeConfig();
const dsn = config.public.sentry.dsn;

// Récupère le code HTTP porté par une erreur (FetchError de $fetch/ofetch,
// H3Error propagé au client, etc.), quel que soit le champ utilisé.
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
    environment: config.public.sentry.environment,

    // Le module @sentry/nuxt câble déjà le routeur Nuxt pour le tracing.
    // GlitchTip supporte le tracing basique — on échantillonne bas.
    tracesSampleRate: 0.01,

    // GlitchTip ne traite pas Session Replay ni Profiling : on ne les active pas.

    // Ne pas joindre les données personnelles identifiables (IP, cookies…).
    sendDefaultPii: false,

    // Bruit connu, sans valeur de debug : requêtes annulées (navigation
    // pendant un fetch, composant démonté), perte de connexion réseau,
    // quirks navigateur.
    ignoreErrors: [
      "AbortError",
      "The user aborted a request",
      "The operation was aborted",
      "signal is aborted without reason",
      "Failed to fetch",
      "NetworkError when attempting to fetch resource",
      "Network request failed",
      "Load failed",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured"
    ],

    // Erreurs provenant d'extensions navigateur : jamais notre code.
    denyUrls: [
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari-web-extension:\/\//
    ],

    // Ne pas remonter les erreurs "client" (4xx) renvoyées par l'API :
    // 401 (session expirée), 403, 404, 422 (validation)… sont attendues.
    // Les 5xx passent toujours.
    beforeSend(event, hint) {
      const status = getStatusCode(hint.originalException);
      if (status !== undefined && status >= 400 && status < 500) {
        return null;
      }
      return event;
    },
  });
}
