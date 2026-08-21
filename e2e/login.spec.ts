import { test, expect } from "@playwright/test";

// Page publique, ne nécessite aucune session — testable sans API ni Keycloak.
test.describe("Page de connexion", () => {
  test("affiche le titre et le bouton de connexion", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "UTB Learn Administration" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  });

  test("n'affiche aucun message d'erreur par défaut", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText(/Une erreur est survenue/)).toHaveCount(0);
  });

  test.describe("messages d'erreur", () => {
    const cases: Array<[string, string]> = [
      ["invalid_state", "La session de connexion a expiré"],
      ["token_exchange_failed", "La connexion a échoué"],
      ["no_agent_match", "Aucun agent de la plateforme ne correspond"],
      ["no_admin_access", "n'a pas les permissions nécessaires"],
      ["unknown_code_xyz", "Une erreur est survenue lors de la connexion"],
    ];

    for (const [code, expectedText] of cases) {
      test(`affiche le bon message pour error=${code}`, async ({ page }) => {
        await page.goto(`/login?error=${code}`);
        await expect(page.getByText(expectedText)).toBeVisible();
      });
    }
  });

  test("le bouton de connexion cible /api/auth/login", async ({ page }) => {
    await page.goto("/login");

    const [request] = await Promise.all([
      page.waitForRequest("**/api/auth/login*"),
      page.getByRole("button", { name: "Se connecter" }).click(),
    ]);

    expect(request.url()).toContain("/api/auth/login");
  });

  test("propage le paramètre redirect vers /api/auth/login", async ({ page }) => {
    await page.goto("/login?redirect=%2Fagents");

    const [request] = await Promise.all([
      page.waitForRequest("**/api/auth/login*"),
      page.getByRole("button", { name: "Se connecter" }).click(),
    ]);

    expect(decodeURIComponent(request.url())).toContain("redirect=/agents");
  });
});
