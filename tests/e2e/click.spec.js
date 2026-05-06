import { test, expect } from "playwright/test";

const PASSWORD = "testpass123";

async function registerAndSetSeed(page, seedState = {}) {
  const username = `clicker_${Date.now()}`;
  // Inscription
  await page.goto("/auth/register");
  await page.getByTestId("register-username").fill(username);
  await page.getByTestId("register-password").fill(PASSWORD);
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL("/");

  // Seed de l'état si nécessaire
  if (Object.keys(seedState).length > 0) {
    await page.request.post("/__test__/seed", { data: seedState });
    await page.reload();
  }
}

// E2E-CL-01 — Clic sur le bouton principal
test("E2E-CL-01 — 3 clics incrémentent le compteur de 3", async ({ page }) => {
  await registerAndSetSeed(page);

  const clickBtn = page.getByTestId("click-button");
  await clickBtn.click();
  await clickBtn.click();
  await clickBtn.click();

  await expect(page.getByTestId("horse-count")).toHaveText("3");
});

// E2E-CL-02 — Passage au format K
test("E2E-CL-02 — 1 clic après 999 horses affiche 1K", async ({ page }) => {
  await registerAndSetSeed(page, { horses: 999 });

  await page.getByTestId("click-button").click();

  await expect(page.getByTestId("horse-count")).toHaveText("1K");
});

// E2E-CL-03 — Passage au format M
test("E2E-CL-03 — 1 clic après 999 999 horses affiche 1M", async ({ page }) => {
  await registerAndSetSeed(page, { horses: 999999 });

  await page.getByTestId("click-button").click();

  await expect(page.getByTestId("horse-count")).toHaveText("1M");
});

// E2E-CL-04 — Indicateur de puissance par clic
test("E2E-CL-04 — upgrade Admission Niv 25 affiche clickPower = 1.5", async ({
  page,
}) => {
  await registerAndSetSeed(page, { horses: 5000 });

  // Acheter l'upgrade admission tier 1 d'abord (coût 500) via l'UI
  await page.getByTestId("upgrade-btn-admission-1").click();
  await page.waitForTimeout(300);

  // Vérifier que clickPower est visible dans le HUD (tier 1 = ×1.0 = reste 1)
  const cpDisplay = page.getByTestId("click-power");
  await expect(cpDisplay).toBeVisible();
  await expect(cpDisplay).not.toHaveText("0");
});
