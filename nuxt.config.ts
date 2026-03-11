// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt"],

  runtimeConfig: {
    // Clés privées (côté serveur uniquement)
    supabaseUrl: process.env.NUXT_SUPABASE_URL,
    supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Clés publiques (côté client)
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY,
    },
  },

  // FIX POUR SUPABASE + WINDOWS ESM
  vite: {
    optimizeDeps: {
      include: [
        "@supabase/supabase-js",
        "@supabase/postgrest-js",
        "prosemirror-state",
        // Prosemirror est utilisé par @nuxt/ui pour l'éditeur de texte riche, et il peut causer des problèmes d'importation dans certains environnements. En incluant explicitement les modules Prosemirror, on s'assure qu'ils sont correctement résolus et optimisés par Vite.
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
      ],
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignorer les warnings d'imports inutilisés de Supabase
          if (
            warning.code === "UNUSED_EXTERNAL_IMPORT" &&
            warning.message.includes("@supabase")
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },

  nitro: {
    externals: {
      inline: ["@supabase/supabase-js", "@supabase/postgrest-js"],
    },
  },

  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": { ssr: true, cors: true },
  },

  compatibilityDate: "2024-07-11",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
