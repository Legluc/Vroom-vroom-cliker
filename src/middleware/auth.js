/**
 * Middleware pour vérifier que l'utilisateur est authentifié.
 * Retourne 401 JSON pour les requêtes API (Accept: application/json ou chemin /game/...).
 * Redirige vers /auth/login pour les requêtes navigateur.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  const isApi =
    req.originalUrl.startsWith("/game") ||
    (req.headers.accept && req.headers.accept.includes("application/json"));
  if (isApi) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  res.redirect("/auth/login");
}

/**
 * Middleware pour rendre userId disponible à toutes les routes
 */
export function attachUserId(req, res, next) {
  res.locals.userId = req.session?.userId || null;
  next();
}
