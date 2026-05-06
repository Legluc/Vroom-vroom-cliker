/**
 * engine/autoclicker.js
 * Gestion des autoclickers : achat, upgrade, calcul du CPS total et gain passif
 */

/**
 * Définition des autoclickers disponibles
 */
const AUTOCLICKERS_CONFIG = {
  basic: {
    id: "basic",
    name: "Clic de base automatisé",
    baseCps: 1,
    costBase: 1000,
    costGrowthRate: 1.15,
  },
  turbo: {
    id: "turbo",
    name: "Turbo-clic",
    baseCps: 5,
    costBase: 5000,
    costGrowthRate: 1.15,
  },
  mega: {
    id: "mega",
    name: "Méga-clic",
    baseCps: 25,
    costBase: 50000,
    costGrowthRate: 1.15,
  },
};

/**
 * Vérifie si un événement est expiré
 * @param {object|null} event - L'événement à vérifier
 * @returns {boolean} true si l'événement est expiré
 */
function isEventExpired(event) {
  if (!event) return false;
  return event.expiresAt < Date.now();
}

/**
 * Calcule le coût d'upgrade d'un autoclicker
 * Formule : costBase × costGrowthRate^level
 *
 * @param {object} autoclicker - L'autoclicker
 * @returns {number} Le coût d'upgrade
 */
export function getUpgradeCost(autoclicker) {
  return (
    autoclicker.costBase *
    Math.pow(autoclicker.costGrowthRate, autoclicker.level)
  );
}

/**
 * Achète un autoclicker et retourne le nouvel état
 *
 * @param {object} state - Le GameState
 * @param {string} autoclickerId - L'ID de l'autoclicker à acheter
 * @returns {object} Le nouvel état
 * @throws {Error} INSUFFICIENT_FUNDS si les chevaux sont insuffisants
 */
export function buyAutoclicker(state, autoclickerId) {
  const config = AUTOCLICKERS_CONFIG[autoclickerId];
  if (!config) {
    throw new Error(`AUTOCLICKER_NOT_FOUND: ${autoclickerId}`);
  }

  const cost = config.costBase;

  if (state.horses < cost) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  const newState = { ...state };
  newState.horses -= cost;

  const newAutoclicker = {
    id: autoclickerId,
    level: 1,
    cps: config.baseCps,
    active: true,
    costBase: config.costBase,
    costGrowthRate: config.costGrowthRate,
  };

  newState.autoclickers = [...state.autoclickers, newAutoclicker];

  return newState;
}

/**
 * Upgrade un autoclicker existant
 *
 * @param {object} state - Le GameState
 * @param {string} autoclickerId - L'ID de l'autoclicker à upgrader
 * @returns {object} Le nouvel état
 * @throws {Error} AUTOCLICKER_NOT_FOUND si l'autoclicker n'existe pas
 * @throws {Error} INSUFFICIENT_FUNDS si les chevaux sont insuffisants
 */
export function upgradeAutoclicker(state, autoclickerId) {
  const autoclicker = state.autoclickers.find((a) => a.id === autoclickerId);

  if (!autoclicker) {
    throw new Error("AUTOCLICKER_NOT_FOUND");
  }

  const config = AUTOCLICKERS_CONFIG[autoclickerId];
  const upgradeCost = getUpgradeCost(autoclicker);

  if (state.horses < upgradeCost) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  const newState = { ...state };
  newState.horses -= upgradeCost;

  const newAutoclickers = newState.autoclickers.map((a) => {
    if (a.id === autoclickerId) {
      return {
        ...a,
        level: a.level + 1,
        cps: config.baseCps * (a.level + 1),
      };
    }
    return a;
  });

  newState.autoclickers = newAutoclickers;

  return newState;
}

/**
 * Calcule le CPS total des autoclickers en tenant compte des événements
 *
 * @param {object} state - Le GameState
 * @returns {number} Le CPS total
 */
export function getTotalCps(state) {
  // Vérifier et nettoyer les événements expirés
  if (state.activeEvent && isEventExpired(state.activeEvent)) {
    state.activeEvent = null;
  }

  // Calculer le CPS de base
  let baseCps = state.autoclickers
    .filter((a) => a.active)
    .reduce((sum, a) => sum + a.cps, 0);

  // Appliquer les multiplicateurs d'événement
  if (state.activeEvent) {
    if (state.activeEvent.type === "AUTOCLICKER_PAUSE") {
      return 0;
    }
    baseCps = baseCps * state.activeEvent.multiplier;
  }

  return baseCps;
}

/**
 * Applique le tick passif : ajoute les chevaux gagnés par les autoclickers
 *
 * @param {object} state - Le GameState
 * @param {number} now - Le timestamp courant en millisecondes
 * @returns {object} Le nouvel état
 */
export function applyTick(state, now) {
  if (!state.lastTickAt) {
    // Premier tick, pas de gain
    return {
      ...state,
      lastTickAt: now,
    };
  }

  const elapsedMs = now - state.lastTickAt;
  const elapsedSeconds = elapsedMs / 1000;

  const cpsTotal = getTotalCps(state);
  const horsesGained = Math.floor(cpsTotal * elapsedSeconds);

  return {
    ...state,
    horses: state.horses + horsesGained,
    totalHorsesEarned: state.totalHorsesEarned + horsesGained,
    lastTickAt: now,
  };
}
