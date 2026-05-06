/**
 * engine/state.js
 * Schéma GameState et helpers pour créer, sérialiser, et désérialiser l'état du jeu.
 */

/**
 * Schéma GameState par défaut
 */
const DEFAULT_STATE = {
  userId: null,

  // Ressource principale
  horses: 0, // nombre courant de chevaux
  totalHorsesEarned: 0, // cumulé depuis le début (pour prestige futur)

  // Clic
  clickPower: 1, // chevaux gagnés par clic manuel

  // Autoclickers
  autoclickers: [], // [{ id, level, cps, active }]

  // Upgrades possédées
  upgrades: [], // [{ categoryId, tierId, purchasedAt }]

  // Upgrades permanentes
  permanentUpgrades: [], // [{ upgradeId, purchasedAt }]

  // Événement actif (null si aucun)
  activeEvent: null, // { type, multiplier, expiresAt, requiresAction }

  // Timestamps
  lastSavedAt: null,
  lastTickAt: null,
};

/**
 * Crée un état initial avec les valeurs par défaut.
 * @param {number|null} userId - L'ID utilisateur (optionnel)
 * @returns {object} Un nouvel état GameState
 */
export function createDefaultState(userId = null) {
  return {
    ...DEFAULT_STATE,
    userId,
  };
}

/**
 * Sérialise un GameState en chaîne JSON.
 * @param {object} state - Le GameState à sérialiser
 * @returns {string} La chaîne JSON
 */
export function serializeState(state) {
  return JSON.stringify(state);
}

/**
 * Désérialise une chaîne JSON en GameState.
 * @param {string} json - La chaîne JSON
 * @returns {object} Le GameState désérialisé
 * @throws {SyntaxError} Si le JSON est malformé
 */
export function deserializeState(json) {
  return JSON.parse(json);
}

/**
 * Fusionne un état partiel (ancienne sauvegarde) avec les valeurs par défaut.
 * @param {object} partialState - L'état partiel à fusionner
 * @returns {object} L'état fusionné avec les valeurs par défaut
 */
export function mergeWithDefaults(partialState) {
  return {
    ...DEFAULT_STATE,
    ...partialState,
  };
}
