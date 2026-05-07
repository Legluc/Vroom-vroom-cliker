const BUILDINGS_CATALOG = {
  stagiaire: {
    id: "stagiaire",
    name: "Stagiaire Mécano",
    baseCost: 15,
    baseCps: 0.1,
    description: "Un apprenti qui serre quelques boulons par seconde.",
  },
  pompe: {
    id: "pompe",
    name: "Pompe à Essence",
    baseCost: 100,
    baseCps: 1,
    description: "Un débit constant de carburant et de revenus.",
  },
  garage: {
    id: "garage",
    name: "Petit Garage",
    baseCost: 1100,
    baseCps: 8,
    description: "Un atelier qui tourne en continu.",
  },
  concessionnaire: {
    id: "concessionnaire",
    name: "Concessionnaire",
    baseCost: 12000,
    baseCps: 47,
    description: "Des ventes à la chaîne et des marges confortables.",
  },
  usine: {
    id: "usine",
    name: "Usine d'Assemblage",
    baseCost: 130000,
    baseCps: 260,
    description: "La production industrielle à plein régime.",
  },
  f1: {
    id: "f1",
    name: "Écurie de F1",
    baseCost: 1400000,
    baseCps: 1400,
    description: "Des bolides de pointe pour une extraction massive.",
  },
};

const UPGRADES_CATALOG = {
  cle_a_chocs: {
    id: "cle_a_chocs",
    name: "Clé à chocs",
    cost: 500,
    description: "Les clics manuels produisent deux fois plus.",
    effect: { type: "click", multiplier: 2 },
    requirements: [],
  },
  formation_acceleree: {
    id: "formation_acceleree",
    name: "Formation Accélérée",
    cost: 1200,
    description: "Les Stagiaires sont deux fois plus efficaces.",
    effect: { type: "building", buildingId: "stagiaire", multiplier: 2 },
    requirements: [{ buildingId: "stagiaire", amount: 10 }],
  },
  carburant_premium: {
    id: "carburant_premium",
    name: "Carburant Premium",
    cost: 9000,
    description: "Les Pompes à Essence doublent leur rendement.",
    effect: { type: "building", buildingId: "pompe", multiplier: 2 },
    requirements: [{ buildingId: "pompe", amount: 10 }],
  },
  atelier_optimise: {
    id: "atelier_optimise",
    name: "Atelier Optimisé",
    cost: 25000,
    description: "Tous les bâtiments produisent 25 % de plus.",
    effect: { type: "allBuildings", multiplier: 1.25 },
    requirements: [{ buildingId: "garage", amount: 5 }],
  },
  chaine_industrielle: {
    id: "chaine_industrielle",
    name: "Chaîne Industrielle",
    cost: 180000,
    description: "Les usines tournent deux fois plus vite.",
    effect: { type: "building", buildingId: "usine", multiplier: 2 },
    requirements: [{ buildingId: "usine", amount: 1 }],
  },
  pole_position: {
    id: "pole_position",
    name: "Pole Position",
    cost: 750000,
    description: "Le clic manuel devient un levier stratégique.",
    effect: { type: "click", multiplier: 5 },
    requirements: [{ buildingId: "f1", amount: 1 }],
  },
};

function createPurchaseError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getBuildingDefinition(buildingId) {
  const building = BUILDINGS_CATALOG[buildingId];

  if (!building) {
    throw createPurchaseError(
      "INVALID_BUILDING",
      `Unknown building: ${buildingId}`,
    );
  }

  return building;
}

function getUpgradeDefinition(upgradeId) {
  const upgrade = UPGRADES_CATALOG[upgradeId];

  if (!upgrade) {
    throw createPurchaseError(
      "INVALID_UPGRADE",
      `Unknown upgrade: ${upgradeId}`,
    );
  }

  return upgrade;
}

function normalizeBuildings(buildings = {}) {
  return Object.fromEntries(
    Object.keys(BUILDINGS_CATALOG).map((buildingId) => [
      buildingId,
      Math.max(0, Number(buildings[buildingId] ?? 0)),
    ]),
  );
}

function normalizeUnlockedUpgrades(unlockedUpgrades = []) {
  return Array.from(new Set(unlockedUpgrades.filter(Boolean).map(String)));
}

function getBuildingCount(state, buildingId) {
  return Number(state.buildings?.[buildingId] ?? 0);
}

function meetsUpgradeRequirements(state, upgradeDefinition) {
  return (upgradeDefinition.requirements ?? []).every((requirement) => {
    const count = getBuildingCount(state, requirement.buildingId);
    return count >= requirement.amount;
  });
}

function getClickMultiplier(state) {
  return normalizeUnlockedUpgrades(state.unlockedUpgrades).reduce(
    (multiplier, upgradeId) => {
      const upgrade = UPGRADES_CATALOG[upgradeId];

      if (upgrade?.effect?.type === "click") {
        return multiplier * upgrade.effect.multiplier;
      }

      return multiplier;
    },
    1,
  );
}

function getBuildingMultiplier(state, buildingId) {
  return normalizeUnlockedUpgrades(state.unlockedUpgrades).reduce(
    (multiplier, upgradeId) => {
      const upgrade = UPGRADES_CATALOG[upgradeId];
      const effect = upgrade?.effect;

      if (effect?.type === "allBuildings") {
        return multiplier * effect.multiplier;
      }

      if (effect?.type === "building" && effect.buildingId === buildingId) {
        return multiplier * effect.multiplier;
      }

      return multiplier;
    },
    1,
  );
}

function calculateBuildingCps(buildingId, state) {
  const building = getBuildingDefinition(buildingId);
  const count = getBuildingCount(state, buildingId);

  if (count <= 0) {
    return 0;
  }

  return count * building.baseCps * getBuildingMultiplier(state, buildingId);
}

function calculateClickPower(state) {
  return 1 * getClickMultiplier(state);
}

function calculatePassiveCps(state) {
  return Object.keys(BUILDINGS_CATALOG).reduce(
    (total, buildingId) => total + calculateBuildingCps(buildingId, state),
    0,
  );
}

function recalculateCachedStats(state) {
  const normalizedState = {
    ...state,
    buildings: normalizeBuildings(state.buildings),
    unlockedUpgrades: normalizeUnlockedUpgrades(state.unlockedUpgrades),
  };

  return {
    ...normalizedState,
    clickPower: calculateClickPower(normalizedState),
    currentPassiveCps: calculatePassiveCps(normalizedState),
  };
}

function getBuildingCost(buildingId, state) {
  const building = getBuildingDefinition(buildingId);
  const owned = getBuildingCount(state, buildingId);
  return Math.ceil(building.baseCost * Math.pow(1.15, owned));
}

function getUpgradeCost(upgradeId) {
  return getUpgradeDefinition(upgradeId).cost;
}

function getPurchaseCost(type, id, state = {}) {
  if (type === "building") {
    return getBuildingCost(id, state);
  }

  if (type === "upgrade") {
    return getUpgradeCost(id);
  }

  throw createPurchaseError(
    "INVALID_PURCHASE_TYPE",
    `Unknown purchase type: ${type}`,
  );
}

function buyBuilding(state, buildingId) {
  const building = getBuildingDefinition(buildingId);
  const cost = getBuildingCost(buildingId, state);

  if ((state.horses ?? 0) < cost) {
    throw createPurchaseError(
      "INSUFFICIENT_FUNDS",
      `Not enough horses for building: ${buildingId}`,
    );
  }

  return recalculateCachedStats({
    ...state,
    horses: (state.horses ?? 0) - cost,
    buildings: {
      ...normalizeBuildings(state.buildings),
      [building.id]: getBuildingCount(state, buildingId) + 1,
    },
  });
}

function buyUpgrade(state, upgradeId) {
  const upgrade = getUpgradeDefinition(upgradeId);
  const ownedUpgrades = normalizeUnlockedUpgrades(state.unlockedUpgrades);

  if (ownedUpgrades.includes(upgradeId)) {
    throw createPurchaseError(
      "ALREADY_OWNED",
      `Upgrade already owned: ${upgradeId}`,
    );
  }

  if (!meetsUpgradeRequirements(state, upgrade)) {
    throw createPurchaseError("UPGRADE_LOCKED", `Upgrade locked: ${upgradeId}`);
  }

  if ((state.horses ?? 0) < upgrade.cost) {
    throw createPurchaseError(
      "INSUFFICIENT_FUNDS",
      `Not enough horses for upgrade: ${upgradeId}`,
    );
  }

  return recalculateCachedStats({
    ...state,
    horses: (state.horses ?? 0) - upgrade.cost,
    unlockedUpgrades: [...ownedUpgrades, upgradeId],
  });
}

function buyPurchase(state, type, id) {
  if (type === "building") {
    return buyBuilding(state, id);
  }

  if (type === "upgrade") {
    return buyUpgrade(state, id);
  }

  throw createPurchaseError(
    "INVALID_PURCHASE_TYPE",
    `Unknown purchase type: ${type}`,
  );
}

function getClickPower(state) {
  return state.clickPower ?? 1;
}

function getPassiveCps(state) {
  return state.currentPassiveCps ?? 0;
}

function getAvailableUpgrades(state) {
  const ownedUpgrades = normalizeUnlockedUpgrades(state.unlockedUpgrades);

  return Object.values(UPGRADES_CATALOG).filter((upgrade) => {
    if (ownedUpgrades.includes(upgrade.id)) {
      return false;
    }

    return meetsUpgradeRequirements(state, upgrade);
  });
}

export {
  BUILDINGS_CATALOG,
  UPGRADES_CATALOG,
  buyBuilding,
  buyPurchase,
  buyUpgrade,
  calculateBuildingCps,
  getAvailableUpgrades,
  getBuildingCost,
  getClickPower,
  getPassiveCps,
  getPurchaseCost,
  getUpgradeCost,
  recalculateCachedStats,
};
