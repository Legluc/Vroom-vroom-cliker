const Database = require("better-sqlite3");

const { runMigrations } = require("../../../src/db/migrations");
const {
  deleteGameState,
  loadGameState,
  saveGameState,
} = require("../../../src/db/gameStateRepo");

function createState(overrides = {}) {
  return {
    userId: 1,
    horses: 100,
    totalHorsesEarned: 100,
    clickPower: 1,
    autoclickers: [],
    upgrades: [],
    activeEvent: null,
    lastSavedAt: null,
    lastTickAt: null,
    ...overrides,
  };
}

function createUser(db, userId = 1, username = `user-${userId}`) {
  db.prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)").run(
    userId,
    username,
    "hashed-password",
  );
}

describe("gameStateRepo", () => {
  let db;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it("sauvegarde un GameState pour un userId", () => {
    createUser(db, 1);
    const state = createState();

    saveGameState(db, 1, state);

    const row = db
      .prepare("SELECT user_id, state_json FROM game_states WHERE user_id = ?")
      .get(1);

    expect(row.user_id).toBe(1);
    expect(JSON.parse(row.state_json)).toEqual(state);
  });

  it("charge un GameState existant", () => {
    createUser(db, 1);
    const state = createState({ horses: 250 });

    saveGameState(db, 1, state);

    expect(loadGameState(db, 1)).toEqual(state);
  });

  it("retourne null pour un userId inexistant", () => {
    expect(loadGameState(db, 999)).toBeNull();
  });

  it("met à jour un GameState existant sans dupliquer la ligne", () => {
    createUser(db, 1);
    saveGameState(db, 1, createState({ horses: 100 }));
    saveGameState(db, 1, createState({ horses: 500 }));

    expect(loadGameState(db, 1).horses).toBe(500);

    const rowCount = db
      .prepare("SELECT COUNT(*) AS count FROM game_states WHERE user_id = ?")
      .get(1).count;

    expect(rowCount).toBe(1);
  });

  it("supprime un GameState", () => {
    createUser(db, 1);
    saveGameState(db, 1, createState());

    deleteGameState(db, 1);

    expect(loadGameState(db, 1)).toBeNull();
  });

  it("lève CORRUPTED_STATE si state_json est invalide", () => {
    createUser(db, 1);
    db.prepare(
      "INSERT INTO game_states (user_id, state_json) VALUES (?, ?)",
    ).run(1, "{ invalid json");

    expect(() => loadGameState(db, 1)).toThrowError(
      expect.objectContaining({ code: "CORRUPTED_STATE" }),
    );
    expect(() => loadGameState(db, 1)).toThrow(/userId=1/);
  });
});
