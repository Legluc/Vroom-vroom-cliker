import express from "express";
import session from "express-session";
import { createAuthRouter } from "./routes/auth.js";
import { createGameRouter } from "./routes/game.js";
import { requireAuth, attachUserId } from "./middleware/auth.js";
import { formatHorses } from "./engine/format.js";
import { UPGRADE_CATALOG } from "./engine/upgrades.js";
import { loadGameState, saveGameState } from "./db/gameStateRepo.js";
import { createDefaultState } from "./engine/state.js";

/**
 * Crée et configure l'application Express
 * @param {Database} db — Instance de la base de données
 * @returns {express.Application} — App Express prête à être utilisée ou démarrée
 */
export function createApp(db) {
  const app = express();

  // Configuration de la session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24, // 24 heures
      },
    }),
  );

  // Middleware pour parser JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Vue engine
  app.set("view engine", "ejs");
  app.set("views", "./src/views");

  // Middleware pour attacher userId aux locals
  app.use(attachUserId);

  // Routes publiques
  app.use("/auth", createAuthRouter(db));

  // Routes d'injection pour les tests (désactivées en production)
  if (process.env.NODE_ENV !== "production") {
    app.post("/__test__/session", (req, res) => {
      req.session.userId = req.body.userId;
      res.status(200).json({ ok: true });
    });

    // Seed du GameState pour les tests E2E
    app.post("/__test__/seed", (req, res) => {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });
      const current = loadGameState(db, userId) ?? createDefaultState(userId);
      const merged = { ...current, ...req.body };
      saveGameState(db, userId, merged);
      res.json({ ok: true });
    });
  }

  // Routes protégées du jeu
  app.use("/game", requireAuth, createGameRouter(db));

  // Route principale protégée
  app.get("/", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const state = loadGameState(db, userId) ?? createDefaultState(userId);
    res.render("index", { state, catalog: UPGRADE_CATALOG, formatHorses });
  });

  // Route 404
  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });

  return app;
}
