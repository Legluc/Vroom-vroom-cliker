import { test, expect } from "playwright/test";

const PASSWORD = "testpass123";

async function registerAndSetSeed(page, seedState = {}) {
  const username = `events_${Date.now()}`;
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

// E2E-EV-01 — Apparition d'une bannière GOLDEN_TURBO
test("E2E-EV-01 — bannière GOLDEN_TURBO visible avec seed", async ({
  page,
}) => {
  await registerAndSetSeed(page, {
    activeEvent: {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: Date.now() + 30000,
      requiresAction: false,
    },
  });

  const banner = page.getByTestId("event-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("GOLDEN TURBO");
  await expect(page.getByTestId("event-countdown")).toBeVisible();
});

// E2E-EV-02 — Disparition automatique d'un événement (durée courte)
test("E2E-EV-02 — bannière disparaît à expiration", async ({ page }) => {
  await registerAndSetSeed(page, {
    activeEvent: {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: Date.now() + 2000, // 2 secondes
      requiresAction: false,
    },
  });

  await expect(page.getByTestId("event-banner")).toBeVisible();
  await page.waitForTimeout(3000);
  // Le banner doit avoir disparu ou l'état ne montre plus d'événement actif
  // (via polling du serveur ou retrait côté client)
  await expect(page.getByTestId("event-banner")).not.toBeVisible({
    timeout: 5000,
  });
});

// E2E-EV-03 — RADAR_ALERT requiert une action
test("E2E-EV-03 — RADAR_ALERT affiche bouton Freiner, clic résout l'alerte", async ({
  page,
}) => {
  await registerAndSetSeed(page, {
    activeEvent: {
      type: "RADAR_ALERT",
      multiplier: 0.1,
      expiresAt: Date.now() + 30000,
      requiresAction: true,
    },
  });

  const resolveBtn = page.getByTestId("event-resolve-btn");
  await expect(resolveBtn).toBeVisible();
  await expect(resolveBtn).toContainText("Freiner");

  await resolveBtn.click();
  await page.waitForTimeout(300);

  await expect(page.getByTestId("event-banner")).not.toBeVisible();
});

// E2E-EV-04 — RADAR_ALERT réduit la production
test("E2E-EV-04 — RADAR_ALERT actif réduit le gain passif", async ({
  page,
}) => {
  await registerAndSetSeed(page, {
    horses: 0,
    autoclickers: [
      {
        id: "basic",
        level: 1,
        cps: 100,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ],
    lastTickAt: Date.now() - 1000,
    activeEvent: {
      type: "RADAR_ALERT",
      multiplier: 0.1,
      expiresAt: Date.now() + 30000,
      requiresAction: true,
    },
  });

  // Déclencher un tick
  await page.request.post("/game/tick", { data: { now: Date.now() } });
  await page.reload();

  // Le gain doit être faible (10% de 100 cps ≈ 10 horses max)
  const horsesText = await page.getByTestId("horse-count").textContent();
  const horses = parseFloat(
    horsesText.replace("K", "000").replace("M", "000000"),
  );
  expect(horses).toBeLessThan(20); // Bien moins que 100
});

// E2E-EV-05 — POLICE_CONTROL bloque tout
test("E2E-EV-05 — POLICE_CONTROL bloque la production, résolution la relance", async ({
  page,
}) => {
  await registerAndSetSeed(page, {
    horses: 0,
    activeEvent: {
      type: "POLICE_CONTROL",
      multiplier: 0,
      expiresAt: Date.now() + 30000,
      requiresAction: true,
    },
  });

  const banner = page.getByTestId("event-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Contrôle de police");

  // Cliquer ne doit rien donner (ou très peu)
  await page.getByTestId("click-button").click();
  await page.waitForTimeout(200);
  await expect(page.getByTestId("horse-count")).toHaveText("0");

  // Résoudre l'événement
  const resolveBtn = page.getByTestId("event-resolve-btn");
  await expect(resolveBtn).toBeVisible();
  await resolveBtn.click();
  await page.waitForTimeout(300);

  // L'événement est résolu, la production reprend
  await expect(page.getByTestId("event-banner")).not.toBeVisible();
  await page.getByTestId("click-button").click();
  await expect(page.getByTestId("horse-count")).not.toHaveText("0");
});
