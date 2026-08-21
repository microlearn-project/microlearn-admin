import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Un seul worker : le serveur cible est `nuxt dev`, dont le SSR compile
  // paresseusement chaque route au premier hit et devient nettement plus
  // lent sous requêtes concurrentes — en parallèle, cette lenteur cumulée
  // dépassait le timeout par test par défaut de façon non déterministe.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3005",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Démarre le serveur de dev Nuxt lui-même — les tests de ce premier lot ne
  // touchent que des pages/routes ne nécessitant pas de session Keycloak
  // réelle (page de connexion, redirection des routes protégées), donc
  // aucune dépendance à l'API ou à Keycloak n'est nécessaire pour les lancer.
  webServer: {
    command: "npm run dev -- --port 3005",
    url: "http://localhost:3005",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
