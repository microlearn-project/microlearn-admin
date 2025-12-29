// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt"],

  runtimeConfig: {
    supabaseUrl: process.env.NUXT_SUPABASE_URL,
    supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY,
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY,
    },
  },
  // FIX POUR SUPABASE + WINDOWS ESM
  vite: {
    optimizeDeps: {
      include: [
        "@supabase/supabase-js", // Force optimisation ESM de Supabase
        "@supabase/postgrest-js", // Et ses dépendances
      ],
    },
  },

  nitro: {
    externals: {
      inline: [
        "@supabase/supabase-js", // Bundle inline pour éviter imports externes cassés
        "@supabase/postgrest-js",
      ],
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
