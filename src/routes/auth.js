import express from "express";
import * as bcrypt from "bcrypt";

export function createAuthRouter(db) {
  const router = express.Router();

  /**
   * GET /auth/register — Affiche le formulaire d'inscription
   */
  router.get("/register", (req, res) => {
    res.render("auth/register", { error: null });
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
        return res.render("auth/register", {
          error: "Pseudo et mot de passe requis.",
        });
      }

      // Vérifier si le pseudo existe déjà
      const existingUser = db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get(username);

      if (existingUser) {
        return res.render("auth/register", {
          error: "Ce pseudo est déjà pris.",
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const result = db
        .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
        .run(username, hashedPassword);

      // Créer la session
      req.session.userId = result.lastInsertRowid;

      res.redirect("/");
    } catch (error) {
      console.error("Error in register:", error);
      res.render("auth/register", { error: "Erreur interne, réessayez." });
    }
  });

  /**
   * GET /auth/login — Affiche le formulaire de connexion
   */
  router.get("/login", (req, res) => {
    res.render("auth/login", { error: null });
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
        return res.render("auth/login", { error: "Identifiants invalides." });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.render("auth/login", { error: "Identifiants invalides." });
      }

      // Créer la session
      req.session.userId = user.id;

      res.redirect("/");
    } catch (error) {
      console.error("Error in login:", error);
      res.render("auth/login", { error: "Erreur interne, réessayez." });
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
