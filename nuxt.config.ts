// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt", "@sentry/nuxt/module"],

  runtimeConfig: {
    // API NestJS (voir server/utils/apiBridge.ts)
    apiBaseUrl: process.env.NUXT_API_BASE_URL,
    keycloakIssuer: process.env.NUXT_KEYCLOAK_ISSUER,

    // Authentification réelle — client Keycloak "utblearn-admin" (confidentiel,
    // Standard flow). Remplace le pont par rôle : chaque requête porte
    // maintenant le vrai token de l'agent connecté.
    keycloakAdminClientId: process.env.NUXT_KEYCLOAK_ADMIN_CLIENT_ID,
    keycloakAdminClientSecret: process.env.NUXT_KEYCLOAK_ADMIN_CLIENT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,

    // Clés publiques (côté client)
    public: {
      // Console de compte Keycloak — changement de mot de passe réel,
      // notre app ne voit plus jamais le mot de passe.
      keycloakAccountUrl: process.env.NUXT_KEYCLOAK_ISSUER
        ? `${process.env.NUXT_KEYCLOAK_ISSUER}/account`
        : undefined,

      // GlitchTip (compatible Sentry). Surchargé par les variables
      // d'env NUXT_PUBLIC_SENTRY_DSN / NUXT_PUBLIC_SENTRY_ENVIRONMENT.
      // Voir sentry.client.config.ts et sentry.server.config.ts.
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || "",
        environment:
          process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT
          || process.env.NODE_ENV
          || "development",
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        "prosemirror-state",
        // Prosemirror est utilisé par @nuxt/ui pour l'éditeur de texte riche, et il peut causer des problèmes d'importation dans certains environnements. En incluant explicitement les modules Prosemirror, on s'assure qu'ils sont correctement résolus et optimisés par Vite.
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
      ],
    },
  },

  // GlitchTip / Sentry — l'init se fait dans sentry.client.config.ts et
  // sentry.server.config.ts. Upload des source maps désactivé pour l'instant
  // (nécessite un auth token GlitchTip + org/project) ; à réactiver ensuite.
  sentry: {
    // Charge sentry.server.config.ts via un import top-level dans le bundle
    // Nitro : pas besoin de passer --import au `node .output/server/index.mjs`
    // en production.
    autoInjectServerSentry: "top-level-import",
    sourceMapsUploadOptions: {
      enabled: false,
    },
  },

  sourcemap: {
    client: "hidden",
  },

  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": { ssr: true, cors: true },
  },

  compatibilityDate: "2026-08-21",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
