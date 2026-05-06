/**
 * engine/events.js
 * Gestion des événements temporaires (bonus/malus)
 */

/**
 * Configuration des événements
 */
const EVENTS_CONFIG = {
  GOLDEN_TURBO: {
    type: "GOLDEN_TURBO",
    multiplier: 3,
    duration: 30000, // 30 secondes
    requiresAction: false,
  },
  AUTO_CLICK_FRENZY: {
    type: "AUTO_CLICK_FRENZY",
    multiplier: 2,
    duration: 20000, // 20 secondes
    requiresAction: false,
  },
  FUEL_SURGE: {
    type: "FUEL_SURGE",
    multiplier: 5,
    duration: 15000, // 15 secondes
    requiresAction: false,
  },
  ENGINE_FAILURE: {
    type: "ENGINE_FAILURE",
    multiplier: 0.5,
    duration: 20000, // 20 secondes
    requiresAction: false,
  },
  AUTOCLICKER_PAUSE: {
    type: "AUTOCLICKER_PAUSE",
    multiplier: 0,
    duration: 15000, // 15 secondes
    requiresAction: false,
  },
  RADAR_ALERT: {
    type: "RADAR_ALERT",
    multiplier: 0.1,
    duration: 30000, // max 30 secondes
    requiresAction: true,
  },
  POLICE_CONTROL: {
    type: "POLICE_CONTROL",
    multiplier: 0,
    duration: 45000, // max 45 secondes
    requiresAction: true,
  },
};

/**
 * Vérifie si un événement est actuellement actif (non expiré)
 *
 * @param {object} state - Le GameState
 * @param {number} now - Le timestamp courant
 * @returns {boolean} true si un événement est actif et non expiré
 */
export function isEventActive(state, now) {
  if (!state.activeEvent) return false;
  return state.activeEvent.expiresAt > now;
}

/**
 * Nettoie un événement expiré
 *
 * @param {object} state - Le GameState
 * @param {number} now - Le timestamp courant
 * @returns {object} Un nouvel état avec l'événement nettoyé si expiré
 */
export function clearExpiredEvent(state, now) {
  if (!state.activeEvent) {
    return state;
  }

  if (state.activeEvent.expiresAt <= now) {
    return {
      ...state,
      activeEvent: null,
    };
  }

  return state;
}

/**
 * Déclenche un événement (s'il n'y en a pas déjà un d'actif)
 *
 * @param {object} state - Le GameState
 * @param {string} eventType - Le type d'événement à déclencher
 * @param {number} now - Le timestamp courant
 * @returns {object} Un nouvel état avec l'événement déclenché
 */
export function tryTriggerEvent(state, eventType, now) {
  // Vérifier s'il y a déjà un événement actif
  if (isEventActive(state, now)) {
    return state;
  }

  const config = EVENTS_CONFIG[eventType];
  if (!config) {
    throw new Error(`UNKNOWN_EVENT: ${eventType}`);
  }

  const newState = { ...state };
  newState.activeEvent = {
    type: eventType,
    multiplier: config.multiplier,
    expiresAt: now + config.duration,
    requiresAction: config.requiresAction,
  };

  return newState;
}

/**
 * Résout un événement interactif (le supprime)
 *
 * @param {object} state - Le GameState
 * @returns {object} Un nouvel état avec l'événement résolu
 * @throws {Error} NO_ACTIVE_EVENT si aucun événement actif
 * @throws {Error} EVENT_NOT_RESOLVABLE si l'événement n'est pas interactif
 */
export function resolveEvent(state) {
  if (!state.activeEvent) {
    throw new Error("NO_ACTIVE_EVENT");
  }

  if (!state.activeEvent.requiresAction) {
    throw new Error("EVENT_NOT_RESOLVABLE");
  }

  return {
    ...state,
    activeEvent: null,
  };
}
