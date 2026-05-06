const UPGRADE_CATALOG = {
  admission: {
    label: "Admission d'air",
    icon: "🌬️",
    tiers: {
      1: {
        cost: 500,
        display: "Filtre en papier usé",
        imageKey: "admission-tier-1",
      },
      25: {
        cost: 1_500,
        display: "Cornet Sport KN",
        imageKey: "admission-tier-25",
      },
      50: {
        cost: 4_500,
        display: "Entrée d'air sur le capot",
        imageKey: "admission-tier-50",
      },
      100: {
        cost: 12_000,
        display: "Aspirateur industriel de chantier",
        imageKey: "admission-tier-100",
      },
      250: {
        cost: 30_000,
        display: "Turbine de Boeing 747",
        imageKey: "admission-tier-250",
      },
      500: {
        cost: 90_000,
        display: "Aspirateur de matière noire spatiale",
        imageKey: "admission-tier-500",
      },
    },
  },
  fuel: {
    label: "Carburant / Injection",
    icon: "⛽",
    tiers: {
      1: {
        cost: 750,
        display: "Sans Plomb 95 coupé à l'eau",
        imageKey: "fuel-tier-1",
      },
      25: {
        cost: 2_250,
        display: "Sans Plomb 98",
        imageKey: "fuel-tier-25",
      },
      50: {
        cost: 6_500,
        display: "Ethanol 85",
        imageKey: "fuel-tier-50",
      },
      100: {
        cost: 18_000,
        display: "Carburant de fusée",
        imageKey: "fuel-tier-100",
      },
      250: {
        cost: 45_000,
        display: "Plutonium enrichi",
        imageKey: "fuel-tier-250",
      },
      500: {
        cost: 125_000,
        display: "Jus de dinosaure pur concentré à 200%",
        imageKey: "fuel-tier-500",
      },
    },
  },
  exhaust: {
    label: "Échappement",
    icon: "💨",
    tiers: {
      1: {
        cost: 600,
        display: "Pot percé de Twingo",
        imageKey: "exhaust-tier-1",
      },
      25: {
        cost: 2_700,
        display: 'Ligne complète Inox "Full Tube"',
        imageKey: "exhaust-tier-25",
      },
      50: {
        cost: 7_500,
        display: "Lance-flammes intégré",
        imageKey: "exhaust-tier-50",
      },
      100: {
        cost: 19_500,
        display: "Orgue de Barbarie cracheur de feu",
        imageKey: "exhaust-tier-100",
      },
      250: {
        cost: 50_000,
        display: "Trompette de Jéricho",
        imageKey: "exhaust-tier-250",
      },
      500: {
        cost: 140_000,
        display: "Propulseur de navette spatiale",
        imageKey: "exhaust-tier-500",
      },
    },
  },
  engine: {
    label: "Bloc moteur",
    icon: "🔧",
    tiers: {
      1: {
        cost: 1_000,
        display: "Moteur de Tondeuse (Monocylindre)",
        engineDisplay: "1-cyl",
        imageKey: "engine-tier-1",
      },
      25: {
        cost: 4_500,
        display: "4 Cylindres en ligne",
        engineDisplay: "4-cyl",
        imageKey: "engine-tier-25",
      },
      50: {
        cost: 12_000,
        display: "Moteur V8 Américain",
        engineDisplay: "V8",
        imageKey: "engine-tier-50",
      },
      100: {
        cost: 28_000,
        display: "W16 de Bugatti",
        engineDisplay: "W16",
        imageKey: "engine-tier-100",
      },
      250: {
        cost: 75_000,
        display: "Moteur V128",
        engineDisplay: "V128",
        imageKey: "engine-tier-250",
      },
      500: {
        cost: 220_000,
        display: "Réacteur Rotatif Infini",
        engineDisplay: "RÉACTEUR",
        imageKey: "engine-tier-500",
      },
    },
  },
};

const PERMANENT_UPGRADES = {
  turbo_starter: {
    name: "Starter Turbo",
    cost: 3_500,
    description: "Placeholder pour une amélioration permanente de départ.",
    imageKey: "permanent-turbo-starter",
  },
  slick_chassis: {
    name: "Châssis Slick",
    cost: 8_500,
    description: "Placeholder pour une amélioration permanente d'esthétique.",
    imageKey: "permanent-slick-chassis",
  },
  reduced_fuel_burn: {
    name: "Baisse du prix de l'essence",
    cost: 15_000,
    description: "Placeholder pour une réduction permanente de coût.",
    imageKey: "permanent-reduced-fuel-burn",
  },
};

function createUpgradeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getTierDefinition(categoryId, tierId) {
  const category = UPGRADE_CATALOG[categoryId];

  if (!category) {
    throw createUpgradeError(
      "INVALID_CATEGORY",
      `Unknown upgrade category: ${categoryId}`,
    );
  }

  const tier = category.tiers[tierId];

  if (!tier) {
    throw createUpgradeError(
      "INVALID_TIER",
      `Unknown upgrade tier: ${categoryId}:${tierId}`,
    );
  }

  return tier;
}

function getPermanentUpgradeDefinition(upgradeId) {
  const upgrade = PERMANENT_UPGRADES[upgradeId];

  if (!upgrade) {
    throw createUpgradeError(
      "INVALID_PERMANENT_UPGRADE",
      `Unknown permanent upgrade: ${upgradeId}`,
    );
  }

  return upgrade;
}

function getPurchaseCost(categoryId, tierId) {
  return getTierDefinition(categoryId, tierId).cost;
}

function getPermanentUpgradeCost(upgradeId) {
  return getPermanentUpgradeDefinition(upgradeId).cost;
}

function hasUpgrade(upgrades, categoryId, tierId) {
  return upgrades.some(
    (upgrade) => upgrade.categoryId === categoryId && upgrade.tierId === tierId,
  );
}

function hasPermanentUpgrade(permanentUpgrades, upgradeId) {
  return permanentUpgrades.some((upgrade) => upgrade.upgradeId === upgradeId);
}

function getSortedTierEntries(categoryId) {
  const category = UPGRADE_CATALOG[categoryId];

  if (!category) {
    return [];
  }

  return Object.entries(category.tiers)
    .map(([tierId, tierDefinition]) => ({
      tierId: Number(tierId),
      ...tierDefinition,
    }))
    .sort((left, right) => left.tierId - right.tierId);
}

function getHighestOwnedTier(state, categoryId) {
  const ownedTiers = (state.upgrades ?? [])
    .filter((upgrade) => upgrade.categoryId === categoryId)
    .map((upgrade) => Number(upgrade.tierId))
    .filter((tierId) => Number.isFinite(tierId))
    .sort((left, right) => left - right);

  if (!ownedTiers.length) {
    return null;
  }

  return ownedTiers[ownedTiers.length - 1];
}

function getCurrentTierDefinition(state, categoryId) {
  const tierId = getHighestOwnedTier(state, categoryId);
  if (tierId === null) {
    const sortedEntries = getSortedTierEntries(categoryId);
    return sortedEntries[0] ?? null;
  }

  return {
    tierId,
    ...getTierDefinition(categoryId, tierId),
  };
}

function getNextTierDefinition(state, categoryId) {
  const currentTierId = getHighestOwnedTier(state, categoryId);
  const sortedEntries = getSortedTierEntries(categoryId);

  if (!sortedEntries.length) {
    return null;
  }

  if (currentTierId === null) {
    return sortedEntries[0];
  }

  const nextEntryIndex = sortedEntries.findIndex(
    (entry) => entry.tierId === currentTierId,
  );

  return sortedEntries[nextEntryIndex + 1] ?? null;
}

function applyUpgradeEffects(state, categoryId) {
  const nextState = {
    ...state,
    upgrades: [...(state.upgrades ?? [])],
  };

  if (typeof nextState.clickPower !== "number") {
    nextState.clickPower = 1;
  }

  if (typeof nextState.cps !== "number") {
    nextState.cps = 0;
  }

  if (categoryId === "engine") {
    const currentTier = getCurrentTierDefinition(nextState, categoryId);
    nextState.engineDisplay = currentTier?.engineDisplay ?? null;
  }

  return nextState;
}

function buyUpgrade(state, categoryId, tierId) {
  const tierDefinition = getTierDefinition(categoryId, tierId);
  const upgrades = state.upgrades ?? [];

  if (hasUpgrade(upgrades, categoryId, tierId)) {
    throw createUpgradeError(
      "ALREADY_OWNED",
      `Upgrade already owned: ${categoryId}:${tierId}`,
    );
  }

  if ((state.horses ?? 0) < tierDefinition.cost) {
    throw createUpgradeError(
      "INSUFFICIENT_FUNDS",
      `Not enough horses for ${categoryId}:${tierId}`,
    );
  }

  const nextState = applyUpgradeEffects(state, categoryId);

  nextState.horses = (state.horses ?? 0) - tierDefinition.cost;
  nextState.upgrades.push({
    categoryId,
    tierId,
    purchasedAt: new Date().toISOString(),
  });

  if (categoryId === "engine") {
    const latestTier = getCurrentTierDefinition(nextState, categoryId);
    nextState.engineDisplay = latestTier?.engineDisplay ?? null;
  }

  return nextState;
}

function buyPermanentUpgrade(state, upgradeId) {
  const upgradeDefinition = getPermanentUpgradeDefinition(upgradeId);
  const permanentUpgrades = state.permanentUpgrades ?? [];

  if (hasPermanentUpgrade(permanentUpgrades, upgradeId)) {
    throw createUpgradeError(
      "ALREADY_OWNED",
      `Permanent upgrade already owned: ${upgradeId}`,
    );
  }

  if ((state.horses ?? 0) < upgradeDefinition.cost) {
    throw createUpgradeError(
      "INSUFFICIENT_FUNDS",
      `Not enough horses for permanent upgrade ${upgradeId}`,
    );
  }

  const nextState = {
    ...state,
    permanentUpgrades: [...permanentUpgrades],
  };

  nextState.horses = (state.horses ?? 0) - upgradeDefinition.cost;
  nextState.permanentUpgrades.push({
    upgradeId,
    purchasedAt: new Date().toISOString(),
  });

  return nextState;
}

function getClickPower(state) {
  return state.clickPower ?? 1;
}

function getPassiveCps(state) {
  return state.cps ?? 0;
}

function getUpgradeCategories() {
  return Object.entries(UPGRADE_CATALOG).map(([categoryId, category]) => ({
    categoryId,
    ...category,
    tiers: Object.entries(category.tiers).map(([tierId, tier]) => ({
      tierId: Number(tierId),
      ...tier,
    })),
  }));
}

function getPermanentUpgradeList() {
  return Object.entries(PERMANENT_UPGRADES).map(([upgradeId, upgrade]) => ({
    upgradeId,
    ...upgrade,
  }));
}

export {
  buyPermanentUpgrade,
  buyUpgrade,
  getClickPower,
  getCurrentTierDefinition,
  getHighestOwnedTier,
  getNextTierDefinition,
  getPassiveCps,
  getPermanentUpgradeCost,
  getPermanentUpgradeDefinition,
  getPermanentUpgradeList,
  getPurchaseCost,
  getSortedTierEntries,
  getUpgradeCategories,
  hasPermanentUpgrade,
  hasUpgrade,
  PERMANENT_UPGRADES,
  UPGRADE_CATALOG,
};
