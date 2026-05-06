const Database = require("better-sqlite3");

const { runMigrations } = require("../../../src/db/migrations");

describe("runMigrations", () => {
  let db;

  beforeEach(() => {
    db = new Database(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("crée les tables users et game_states", () => {
    runMigrations(db);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all()
      .map((row) => row.name);

    expect(tables).toContain("game_states");
    expect(tables).toContain("users");
  });

  it("est idempotent quand les tables existent déjà", () => {
    runMigrations(db);

    expect(() => runMigrations(db)).not.toThrow();

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all()
      .map((row) => row.name);

    expect(tables).toContain("game_states");
    expect(tables).toContain("users");
  });
});
