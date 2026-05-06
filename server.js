import Database from "better-sqlite3";
import { createApp } from "./src/app.js";
import { runMigrations } from "./src/db/migrations.js";

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || "./data/vroom.db";

const db = new Database(DB_URL === ":memory:" ? ":memory:" : DB_URL);
runMigrations(db);

const app = createApp(db);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
