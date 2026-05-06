import { test, expect } from "playwright/test";

const PASSWORD = "testpass123";

async function registerUser(page, username) {
  await page.goto("/auth/register");
  await page.getByTestId("register-username").fill(username);
  await page.getByTestId("register-password").fill(PASSWORD);
  await page.getByTestId("register-submit").click();
}

// E2E-AUTH-01 — Inscription complète
test("E2E-AUTH-01 — inscription redirige vers la page de jeu", async ({
  page,
}) => {
  await registerUser(page, `pilote_01_${Date.now()}`);
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("horse-count")).toBeVisible();
});

// E2E-AUTH-02 — Connexion et persistance de session
test("E2E-AUTH-02 — connexion accède à la page du jeu", async ({ page }) => {
  const username = `pilote_02_${Date.now()}`;
  // Créer le compte d'abord
  await registerUser(page, username);
  await expect(page).toHaveURL("/");
  // Se déconnecter
  await page.getByTestId("logout-btn").click();
  // Se reconnecter
  await page.goto("/auth/login");
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(PASSWORD);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL("/");
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "connect.sid")).toBeTruthy();
});

// E2E-AUTH-03 — Formulaire de connexion en erreur
test("E2E-AUTH-03 — mauvais mot de passe affiche une erreur", async ({
  page,
}) => {
  const username = `pilote_03_${Date.now()}`;
  await registerUser(page, username);
  await expect(page).toHaveURL("/");
  await page.getByTestId("logout-btn").click();
  await page.goto("/auth/login");
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill("mauvais_mdp");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL("/auth/login");
  await expect(page.getByTestId("auth-error")).toBeVisible();
});

// E2E-AUTH-04 — Accès direct sans compte
test("E2E-AUTH-04 — accès direct à / sans session redirige vers /auth/login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/auth/login");
});
