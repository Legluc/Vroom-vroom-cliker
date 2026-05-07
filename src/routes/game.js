import { Router } from "express";
import { processClick } from "../engine/click.js";
import {
  buyBuilding,
  buyUpgrade,
  recalculateCachedStats,
} from "../engine/upgrades.js";
import {
  buyAutoclicker,
  upgradeAutoclicker,
  applyTick,
} from "../engine/autoclicker.js";
import { resolveEvent } from "../engine/events.js";
import { createDefaultState, mergeWithDefaults } from "../engine/state.js";
import { saveGameState, loadGameState } from "../db/gameStateRepo.js";

/**
 * Crée le router des routes du jeu.
 * Toutes les routes supposent que requireAuth a déjà été appliqué.
 * @param {import('better-sqlite3').Database} db
 * @returns {Router}
 */
export function createGameRouter(db) {
  const router = Router();

  // Helper : charge l'état ou crée un défaut
  function getState(userId) {
    const loaded = loadGameState(db, userId);
    const baseState = loaded ?? createDefaultState(userId);
    return recalculateCachedStats(mergeWithDefaults(baseState));
  }

  // GET /game/state — récupère le GameState courant
  router.get("/state", (req, res) => {
    const userId = req.session.userId;
    const state = getState(userId);
    res.json(state);
  });

  // POST /game/click — effectue un clic manuel
  router.post("/click", (req, res) => {
    const userId = req.session.userId;
    const state = getState(userId);
    const newState = processClick(state);
    saveGameState(db, userId, newState);
    res.json({
      horses: newState.horses,
      clickPower: newState.clickPower,
      activeEvent: newState.activeEvent,
    });
  });

  function handlePurchase(res, state, purchaseFn) {
    try {
      const newState = purchaseFn(state);
      saveGameState(db, state.userId, newState);
      return res.json(newState);
    } catch (err) {
      const code = err.code ?? err.message;
      if (code === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
      }
      return res.status(400).json({ error: code });
    }
  }

  // POST /game/building/buy — achète un bâtiment
  router.post("/building/buy", (req, res) => {
    const { buildingId } = req.body ?? {};

    if (!buildingId) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const userId = req.session.userId;
    const state = getState(userId);

    return handlePurchase(res, { ...state, userId }, (currentState) =>
      buyBuilding(currentState, buildingId),
    );
  });

  // POST /game/upgrade/buy — achète une amélioration one-off
  router.post("/upgrade/buy", (req, res) => {
    const { upgradeId } = req.body ?? {};

    if (!upgradeId) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const userId = req.session.userId;
    const state = getState(userId);

    return handlePurchase(res, { ...state, userId }, (currentState) =>
      buyUpgrade(currentState, upgradeId),
    );
  });

  // Alias de compatibilité pour l'ancien client
  router.post("/upgrade", (req, res) => {
    const { upgradeId } = req.body ?? {};

    if (!upgradeId) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const userId = req.session.userId;
    const state = getState(userId);

    return handlePurchase(res, { ...state, userId }, (currentState) =>
      buyUpgrade(currentState, upgradeId),
    );
  });

  // POST /game/autoclicker/buy — achète un autoclicker
  router.post("/autoclicker/buy", (req, res) => {
    const { autoclickerId } = req.body ?? {};

    if (!autoclickerId) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const userId = req.session.userId;
    const state = getState(userId);

    try {
      const newState = buyAutoclicker(state, autoclickerId);
      saveGameState(db, userId, newState);
      return res.json(newState);
    } catch (err) {
      const code = err.message;
      if (code === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
      }
      return res.status(400).json({ error: code });
    }
  });

  // POST /game/autoclicker/upgrade — améliore un autoclicker existant
  router.post("/autoclicker/upgrade", (req, res) => {
    const { autoclickerId } = req.body ?? {};

    if (!autoclickerId) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const userId = req.session.userId;
    const state = getState(userId);

    try {
      const newState = upgradeAutoclicker(state, autoclickerId);
      saveGameState(db, userId, newState);
      return res.json(newState);
    } catch (err) {
      const code = err.message;
      if (code === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
      }
      return res.status(400).json({ error: code });
    }
  });

  // POST /game/event/resolve — résout l'événement actif
  router.post("/event/resolve", (req, res) => {
    const userId = req.session.userId;
    const state = getState(userId);

    try {
      const newState = resolveEvent(state);
      saveGameState(db, userId, newState);
      return res.json(newState);
    } catch (err) {
      if (err.message === "NO_ACTIVE_EVENT") {
        return res.status(400).json({ error: "NO_ACTIVE_EVENT" });
      }
      return res.status(400).json({ error: err.message });
    }
  });

  // POST /game/tick — applique le gain passif des autoclickers
  router.post("/tick", (req, res) => {
    const now = req.body?.now ?? Date.now();
    const userId = req.session.userId;
    const state = getState(userId);
    const newState = applyTick(state, now);
    saveGameState(db, userId, newState);
    return res.json(newState);
  });

  return router;
}
