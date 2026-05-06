import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import Database from "better-sqlite3";
import { createApp } from "../../../src/app.js";
import { runMigrations } from "../../../src/db/migrations.js";
import { saveGameState } from "../../../src/db/gameStateRepo.js";
import { createDefaultState } from "../../../src/engine/state.js";

// Test fixtures
const TEST_USER = { username: "testgamer", password: "testpass123" };

/**
 * Crée un utilisateur, insère un GameState initial et retourne le cookie de session.
 */
async function setupAuthenticatedUser(app, db, overrideState = {}) {
  // Créer l'utilisateur directement en DB
  const result = db
    .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(TEST_USER.username, "hashed_irrelevant");

  const userId = result.lastInsertRowid;
  const state = { ...createDefaultState(userId), ...overrideState };
  saveGameState(db, userId, state);

  // Se connecter via supertest pour obtenir un cookie de session
  // On utilise une route spéciale de test qui force la session
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

  // SCENARIO G-01 — Récupération du state
  it("G-01 — GET /game/state retourne le GameState de l'utilisateur connecté", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    const state = createDefaultState(userId);
    saveGameState(db, userId, state);

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.get("/game/state");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("horses");
    expect(response.body).toHaveProperty("clickPower");
    expect(response.body).toHaveProperty("upgrades");
    expect(response.body).toHaveProperty("activeEvent");
  });

  // SCENARIO G-02 — GET /game/state sans session
  it("G-02 — GET /game/state sans session retourne 401", async () => {
    const response = await request(app).get("/game/state");
    expect(response.status).toBe(401);
  });

  // SCENARIO G-03 — Clic normal
  it("G-03 — POST /game/click incrémente les horses et persiste", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      horses: 0,
      clickPower: 1,
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/click");

    expect(response.status).toBe(200);
    expect(response.body.horses).toBe(1);
    expect(response.body.clickPower).toBe(1);
  });

  // SCENARIO G-04 — Clic rapide successif
  it("G-04 — POST /game/click × 5 donne horses = 5 × clickPower", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      horses: 0,
      clickPower: 1,
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    for (let i = 0; i < 5; i++) {
      await agent.post("/game/click");
    }

    const stateResponse = await agent.get("/game/state");
    expect(stateResponse.body.horses).toBe(5);
  });

  // SCENARIO G-05 — Achat d'un upgrade valide
  it("G-05 — POST /game/upgrade achète un upgrade avec fonds suffisants", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 10000 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/upgrade")
      .send({ categoryId: "admission", tierId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.horses).toBeLessThan(10000);
    expect(response.body.upgrades).toContainEqual(
      expect.objectContaining({ categoryId: "admission", tierId: 1 }),
    );
  });

  // SCENARIO G-06 — Achat d'un upgrade sans fonds
  it("G-06 — POST /game/upgrade avec fonds insuffisants retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 10 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/upgrade")
      .send({ categoryId: "admission", tierId: 25 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INSUFFICIENT_FUNDS");
  });

  // SCENARIO G-07 — Achat d'un autoclicker
  it("G-07 — POST /game/autoclicker/buy ajoute un autoclicker", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 5000 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/buy")
      .send({ autoclickerId: "basic" });

    expect(response.status).toBe(200);
    expect(response.body.autoclickers).toContainEqual(
      expect.objectContaining({ id: "basic" }),
    );
  });

  // SCENARIO G-08 — Upgrade d'un autoclicker
  it("G-08 — POST /game/autoclicker/upgrade passe l'autoclicker au niveau 2", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;

    // Créer un état avec un autoclicker déjà acheté
    const stateWithAc = {
      ...createDefaultState(userId),
      horses: 50000,
      autoclickers: [{ id: "basic", level: 1, cps: 1, active: true }],
    };
    saveGameState(db, userId, stateWithAc);

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/upgrade")
      .send({ autoclickerId: "basic" });

    expect(response.status).toBe(200);
    const ac = response.body.autoclickers.find((a) => a.id === "basic");
    expect(ac.level).toBe(2);
  });

  // SCENARIO G-09 — Résolution d'un événement interactif
  it("G-09 — POST /game/event/resolve résout RADAR_ALERT", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      activeEvent: {
        type: "RADAR_ALERT",
        multiplier: 0.1,
        expiresAt: Date.now() + 30000,
        requiresAction: true,
      },
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/event/resolve");

    expect(response.status).toBe(200);
    expect(response.body.activeEvent).toBeNull();
  });

  // SCENARIO G-10 — Résolution sans événement actif
  it("G-10 — POST /game/event/resolve sans événement retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      activeEvent: null,
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/event/resolve");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("NO_ACTIVE_EVENT");
  });

  // SCENARIO G-11 — Tick passif
  it("G-11 — POST /game/tick applique le CPS passif selon lastTickAt", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;

    const now = Date.now();
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      horses: 0,
      autoclickers: [{ id: "basic", level: 1, cps: 10, active: true }],
      lastTickAt: now - 1000, // il y a 1 seconde
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/tick").send({ now });

    expect(response.status).toBe(200);
    expect(response.body.horses).toBeGreaterThan(0);
  });

  // SCENARIO G-12 — Body malformé
  it("G-12 — POST /game/upgrade avec body invalide retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, createDefaultState(userId));

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/upgrade")
      .send({ categoryId: "admission" }); // tierId manquant

    expect(response.status).toBe(400);
  });

  // Branches supplémentaires — couverture game.js

  it("bonus — POST /game/upgrade avec categoryId invalide retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 9999 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/upgrade")
      .send({ categoryId: "inexistant", tierId: 1 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("bonus — POST /game/autoclicker/buy sans autoclickerId retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, createDefaultState(userId));

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/autoclicker/buy").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_BODY");
  });

  it("bonus — POST /game/autoclicker/buy autoclickerId invalide retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 9999 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/buy")
      .send({ autoclickerId: "nexistepas" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("bonus — POST /game/autoclicker/upgrade sans autoclickerId retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, createDefaultState(userId));

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/autoclicker/upgrade").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_BODY");
  });

  it("bonus — POST /game/autoclicker/upgrade autoclickerId invalide retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 50000 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/upgrade")
      .send({ autoclickerId: "nexistepas" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("bonus — POST /game/autoclicker/buy avec fonds insuffisants retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, { ...createDefaultState(userId), horses: 0 });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/buy")
      .send({ autoclickerId: "basic" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INSUFFICIENT_FUNDS");
  });

  it("bonus — POST /game/autoclicker/upgrade avec fonds insuffisants retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      horses: 0,
      autoclickers: [
        {
          id: "basic",
          level: 1,
          cps: 1,
          active: true,
          costBase: 1000,
          costGrowthRate: 1.15,
        },
      ],
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent
      .post("/game/autoclicker/upgrade")
      .send({ autoclickerId: "basic" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INSUFFICIENT_FUNDS");
  });

  it("bonus — POST /game/event/resolve avec EVENT_NOT_RESOLVABLE retourne 400", async () => {
    const result = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(TEST_USER.username, "hash");
    const userId = result.lastInsertRowid;
    // Événement sans requiresAction
    saveGameState(db, userId, {
      ...createDefaultState(userId),
      activeEvent: {
        type: "TURBO_BOOST",
        multiplier: 2,
        expiresAt: Date.now() + 30000,
        requiresAction: false,
      },
    });

    const agent = request.agent(app);
    await agent.post("/__test__/session").send({ userId });

    const response = await agent.post("/game/event/resolve");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
