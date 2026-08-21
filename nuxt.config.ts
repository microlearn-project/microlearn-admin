// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt"],

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
