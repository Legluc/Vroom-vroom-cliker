/**
 * Middleware pour vérifier que l'utilisateur est authentifié
 * Redirige vers /auth/login si pas de session valide
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect("/auth/login");
  }
}

/**
 * Middleware pour rendre userId disponible à toutes les routes
 */
export function attachUserId(req, res, next) {
  res.locals.userId = req.session?.userId || null;
  next();
}
