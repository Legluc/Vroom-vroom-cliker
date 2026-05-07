import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import Database from "better-sqlite3";
import { createApp } from "../../../src/app.js";
import { runMigrations } from "../../../src/db/migrations.js";
import { saveGameState } from "../../../src/db/gameStateRepo.js";
import { createDefaultState } from "../../../src/engine/state.js";

const TEST_USER = { username: "testgamer", password: "testpass123" };

async function setupAuthenticatedUser(app, db, overrideState = {}) {
  const result = db
    .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(TEST_USER.username, "hashed_irrelevant");

  const userId = result.lastInsertRowid;
  const state = { ...createDefaultState(userId), ...overrideState };
  saveGameState(db, userId, state);

  const agent = request.agent(app);
  await agent.post("/__test__/session").send({ userId });

  return { agent, userId, state };
}

describe("Routes Game", () => {
  let app;
  let db;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    app = createApp(db);
  });

  it("retourne un state hydraté avec buildings et currentPassiveCps", async () => {
    const { agent, userId } = await setupAuthenticatedUser(app, db, {
      horses: 1000,
      buildings: { stagiaire: 10 },
    });

    const response = await agent.get("/game/state");

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body).toHaveProperty("buildings");
    expect(response.body).toHaveProperty("unlockedUpgrades");
    expect(response.body).toHaveProperty("currentPassiveCps");
  });

  it("achète un bâtiment et persiste le cache passif", async () => {
    const { agent } = await setupAuthenticatedUser(app, db, { horses: 2000 });

    const response = await agent
      .post("/game/building/buy")
      .send({ buildingId: "stagiaire" });

    expect(response.status).toBe(200);
    expect(response.body.buildings.stagiaire).toBe(1);
    expect(response.body.currentPassiveCps).toBeGreaterThan(0);
  });

  it("achète une amélioration one-off via le nouvel endpoint", async () => {
    const { agent } = await setupAuthenticatedUser(app, db, {
      horses: 10_000,
      buildings: { stagiaire: 10 },
    });

    const response = await agent
      .post("/game/upgrade/buy")
      .send({ upgradeId: "formation_acceleree" });

    expect(response.status).toBe(200);
    expect(response.body.unlockedUpgrades).toContain("formation_acceleree");
    expect(response.body.currentPassiveCps).toBeGreaterThan(0);
  });

  it("refuse un achat de bâtiment sans body valide", async () => {
    const { agent } = await setupAuthenticatedUser(app, db, { horses: 1000 });

    const response = await agent.post("/game/building/buy").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_BODY");
  });

  it("refuse une upgrade verrouillée", async () => {
    const { agent } = await setupAuthenticatedUser(app, db, { horses: 10_000 });

    const response = await agent
      .post("/game/upgrade/buy")
      .send({ upgradeId: "formation_acceleree" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("UPGRADE_LOCKED");
  });

  it("POST /game/tick utilise aussi le CPS passif cache", async () => {
    const now = Date.now();
    const { agent } = await setupAuthenticatedUser(app, db, {
      horses: 0,
      buildings: { stagiaire: 10 },
      currentPassiveCps: 1,
      lastTickAt: now - 1000,
    });

    const response = await agent.post("/game/tick").send({ now });

    expect(response.status).toBe(200);
    expect(response.body.horses).toBeGreaterThan(0);
  });
});
