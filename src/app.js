import express from "express";
import session from "express-session";
import { createAuthRouter } from "./routes/auth.js";
import { requireAuth, attachUserId } from "./middleware/auth.js";

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

  // Routes protégées (nécessitent une session)
  app.get("/", requireAuth, (req, res) => {
    res.render("index");
  });

  // Route 404
  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });

  return app;
}
