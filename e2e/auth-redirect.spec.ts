import { test, expect } from "@playwright/test";

// middleware/auth.global.ts redirige toute route protégée vers /login quand
// /api/auth/me répond "non authentifié" — testable sans session Keycloak
// réelle puisque l'absence de cookie de session suffit à déclencher ce cas.
test.describe("Redirection des routes protégées (non authentifié)", () => {
  test("redirige / vers /login avec le bon paramètre redirect", async ({ page }) => {
    await page.goto("/");

    await page.waitForURL(/\/login\?redirect=/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe("/");
  });

  test("redirige /agents vers /login en conservant le chemin d'origine", async ({ page }) => {
    await page.goto("/agents");

    await page.waitForURL(/\/login\?redirect=/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe("/agents");
  });

  test("redirige /settings/security vers /login en conservant le chemin d'origine", async ({
    page,
  }) => {
    await page.goto("/settings/security");

    await page.waitForURL(/\/login\?redirect=/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe(
      "/settings/security",
    );
  });
});
