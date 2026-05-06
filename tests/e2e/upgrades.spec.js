import { test, expect } from "playwright/test";

const PASSWORD = "testpass123";

async function registerAndSetSeed(page, seedState = {}) {
  const username = `upgrader_${Date.now()}`;
  await page.goto("/auth/register");
  await page.getByTestId("register-username").fill(username);
  await page.getByTestId("register-password").fill(PASSWORD);
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL("/");

  if (Object.keys(seedState).length > 0) {
    await page.request.post("/__test__/seed", { data: seedState });
    await page.reload();
  }
}

// E2E-UP-01 — Bouton upgrade grisé sans fonds
test("E2E-UP-01 — boutons upgrade désactivés avec 0 horses", async ({
  page,
}) => {
  await registerAndSetSeed(page, { horses: 0 });

  // Tous les boutons d'upgrade doivent être désactivés
  const upgradeButtons = page.locator("[data-testid^='upgrade-btn-']");
  const count = await upgradeButtons.count();

  for (let i = 0; i < count; i++) {
    await expect(upgradeButtons.nth(i)).toBeDisabled();
  }
});

// E2E-UP-02 — Achat d'un upgrade Admission
test("E2E-UP-02 — achat upgrade Admission Niv 1 réduit les horses", async ({
  page,
}) => {
  await registerAndSetSeed(page, { horses: 50000 });

  const horsesText = await page.getByTestId("horse-count").textContent();
  await page.getByTestId("upgrade-btn-admission-1").click();
  await page.waitForTimeout(300);

  // Le solde a diminué
  const newHorsesText = await page.getByTestId("horse-count").textContent();
  expect(newHorsesText).not.toBe(horsesText);

  // L'upgrade apparaît comme possédée
  await expect(page.getByTestId("upgrade-owned-admission-1")).toBeVisible();

  // clickPower est mis à jour dans le HUD
  await expect(page.getByTestId("click-power")).toBeVisible();
});

// E2E-UP-03 — Affichage type de moteur
test("E2E-UP-03 — achat engine Niv 1 affiche 1-cyl", async ({ page }) => {
  await registerAndSetSeed(page, { horses: 100000 });

  await page.getByTestId("upgrade-btn-engine-1").click();
  await page.waitForTimeout(300);

  await expect(page.getByTestId("engine-display")).toContainText("1-cyl");
});

// E2E-UP-04 — Upgrade ne peut pas être acheté deux fois
test("E2E-UP-04 — upgrade déjà possédé a son bouton désactivé", async ({
  page,
}) => {
  await registerAndSetSeed(page, { horses: 50000 });

  await page.getByTestId("upgrade-btn-admission-1").click();
  await page.waitForTimeout(300);

  // Après achat, le bouton doit être désactivé
  await expect(page.getByTestId("upgrade-btn-admission-1")).toBeDisabled();
});
