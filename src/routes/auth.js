import express from "express";
import * as bcrypt from "bcrypt";

export function createAuthRouter(db) {
  const router = express.Router();

  /**
   * GET /auth/register — Affiche le formulaire d'inscription
   */
  router.get("/register", (req, res) => {
    res.render("auth/register");
  });

  /**
   * POST /auth/register — Crée un compte utilisateur
   * Body: { username, password }
   */
  router.post("/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Valider les champs
      if (!username || !password) {
        return res.status(400).json({ error: "MISSING_FIELDS" });
      }

      // Vérifier si le pseudo existe déjà
      const existingUser = db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get(username);

      if (existingUser) {
        return res.status(409).json({ error: "USERNAME_TAKEN" });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const result = db
        .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
        .run(username, hashedPassword);

      // Créer la session
      req.session.userId = result.lastInsertRowid;

      res.status(201).json({ userId: result.lastInsertRowid });
    } catch (error) {
      console.error("Error in register:", error);
      res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  });

  /**
   * GET /auth/login — Affiche le formulaire de connexion
   */
  router.get("/login", (req, res) => {
    res.render("auth/login");
  });

  /**
   * POST /auth/login — Authentifie un utilisateur
   * Body: { username, password }
   */
  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Chercher l'utilisateur
      const user = db
        .prepare("SELECT id, password FROM users WHERE username = ?")
        .get(username);

      if (!user) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
      }

      // Créer la session
      req.session.userId = user.id;

      res.json({ userId: user.id });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  });

  /**
   * POST /auth/logout — Déconnecte l'utilisateur
   */
  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "LOGOUT_ERROR" });
      }
      res.redirect("/auth/login");
    });
  });

  /**
   * GET /auth/logout — Alternative GET pour déconnexion
   */
  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "LOGOUT_ERROR" });
      }
      res.redirect("/auth/login");
    });
  });

  return router;
}
