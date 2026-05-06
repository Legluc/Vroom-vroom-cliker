import { test, expect } from "playwright/test";

const PASSWORD = "testpass123";

async function registerAndSeed(page, seedState = {}) {
  const username = `persist_${Date.now()}`;
  await page.goto("/auth/register");
  await page.getByTestId("register-username").fill(username);
  await page.getByTestId("register-password").fill(PASSWORD);
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL("/");

  if (Object.keys(seedState).length > 0) {
    await page.request.post("/__test__/seed", { data: seedState });
    await page.reload();
  }

  return username;
}

// E2E-PERSIST-01 — Sauvegarde et rechargement
test("E2E-PERSIST-01 — rechargement de page conserve horses et upgrades", async ({
  page,
}) => {
  // GIVEN : connecté avec 5 000 horses et 1 clic effectué (sauvegardé en DB)
  await registerAndSeed(page, { horses: 5000 });

  // Vérifier état initial
  await expect(page.getByTestId("horse-count")).toBeVisible();

  // WHEN : effectuer un clic (sauvegarde en DB via POST /game/click)
  await page.getByTestId("click-button").click();
  await page.waitForTimeout(200);

  // Puis acheter un upgrade (sauvegarde en DB via POST /game/upgrade)
  await page.getByTestId("upgrade-btn-admission-1").click();
  await page.waitForTimeout(500);

  // Capturer l'état après achat
  const horsesAfterBuy = await page.getByTestId("horse-count").textContent();

  // WHEN : recharger la page (F5)
  await page.reload();

  // THEN : horses affiche toujours la même valeur
  await expect(page.getByTestId("horse-count")).toHaveText(horsesAfterBuy);

  // ET : l'upgrade est toujours marqué comme possédé
  await expect(page.getByTestId("upgrade-owned-admission-1")).toBeVisible();
});

// E2E-PERSIST-02 — Déconnexion / reconnexion
test("E2E-PERSIST-02 — déconnexion et reconnexion conserve horses et upgrades", async ({
  page,
}) => {
  // GIVEN : utilisateur avec 12 000 horses et 2 upgrades possédées
  const username = await registerAndSeed(page, { horses: 12000 });

  // Acheter 2 upgrades pour les retrouver après reconnexion
  // Upgrade admission tier 1 (coût 500)
  await page.getByTestId("upgrade-btn-admission-1").click();
  await page.waitForTimeout(400);

  // Upgrade fuel tier 1 (coût 500 selon catalog)
  await page.getByTestId("upgrade-btn-fuel-1").click();
  await page.waitForTimeout(400);

  // Capturer les horses restants
  const horsesText = await page.getByTestId("horse-count").textContent();

  // WHEN : déconnecter
  await page.getByTestId("logout-btn").click();
  await expect(page).toHaveURL("/auth/login");

  // Se reconnecter
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(PASSWORD);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL("/");

  // THEN : horses = valeur conservée
  await expect(page.getByTestId("horse-count")).toHaveText(horsesText);

  // ET : les 2 upgrades sont toujours possédées
  await expect(page.getByTestId("upgrade-owned-admission-1")).toBeVisible();
  await expect(page.getByTestId("upgrade-owned-fuel-1")).toBeVisible();
});
