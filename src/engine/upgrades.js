const UPGRADE_CATALOG = {
  admission: {
    baseCost: 500,
    growthRate: 3,
    effect: "clickPower",
    tiers: [
      { tierId: 1, multiplier: 1, label: "Filtre en papier usé" },
      { tierId: 25, multiplier: 1.5, label: "Conduit sport" },
      { tierId: 50, multiplier: 2.5, label: "Entrée d'air sur le capot" },
      { tierId: 100, multiplier: 5, label: "Aspirateur industriel (bricolé)" },
      { tierId: 250, multiplier: 15, label: "Turbine (type avion)" },
      { tierId: 500, multiplier: 50, label: "Aspirateur de matière noire" },
    ],
  },
  fuel: {
    baseCost: 750,
    growthRate: 3,
    effect: "cps",
    tiers: [
      { tierId: 1, multiplier: 1, label: "Sans Plomb 95 (dilué)" },
      { tierId: 25, multiplier: 1.5, label: "Sans Plomb 98" },
      { tierId: 50, multiplier: 3, label: "Méthanol 85" },
      { tierId: 100, multiplier: 8, label: "Carburant de fusée" },
      { tierId: 250, multiplier: 25, label: "Plutonium enrichi" },
      { tierId: 500, multiplier: 100, label: "Jus de dinosaure concentré ×200" },
    ],
  },
  exhaust: {
    baseCost: 650,
    growthRate: 3,
    effect: "clickPower",
    tiers: [
      { tierId: 1, multiplier: 1, label: "Pot percé (Twingo)" },
      { tierId: 25, multiplier: 2, label: "Ligne complète inox \"Full Tube\"" },
      { tierId: 50, multiplier: 4, label: "Lance-flammes intégré" },
      { tierId: 100, multiplier: 10, label: "Orgue / cracheur de feu" },
      { tierId: 250, multiplier: 30, label: "Trompette surpuissante" },
      { tierId: 500, multiplier: 100, label: "Propulseur de navette spatiale" },
    ],
  },
  engine: {
    baseCost: 900,
    growthRate: 3.2,
    effect: "cps",
    tiers: [
      { tierId: 1, multiplier: 1, display: "1-cyl", label: "Moteur de tondeuse (monocylindre)" },
      { tierId: 25, multiplier: 3, display: "4-cyl", label: "4 cylindres en ligne" },
      { tierId: 50, multiplier: 7, display: "V8", label: "Moteur V8 américain" },
      { tierId: 100, multiplier: 20, display: "V10", label: "V10 (Bugatti)" },
      { tierId: 250, multiplier: 60, display: "V12", label: "V12 (prend la moitié de la voiture)" },
      { tierId: 500, multiplier: 200, display: "RÉACTEUR", label: "Réacteur/rotor expérimental" },
    ],
  },
};

function createUpgradeError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function getCategoryDefinition(categoryId) {
  const definition = UPGRADE_CATALOG[categoryId];

  if (!definition) {
    throw createUpgradeError("INVALID_CATEGORY", `Unknown upgrade category: ${categoryId}`);
  }

  return definition;
}

function getTierDefinition(categoryId, tierId) {
  const categoryDefinition = getCategoryDefinition(categoryId);
  const tierDefinition = categoryDefinition.tiers.find((tier) => tier.tierId === tierId);

  if (!tierDefinition) {
    throw createUpgradeError("INVALID_TIER", `Unknown upgrade tier: ${categoryId}:${tierId}`);
  }

  return tierDefinition;
}

function getPurchaseCost(categoryId, tierId) {
  const categoryDefinition = getCategoryDefinition(categoryId);
  getTierDefinition(categoryId, tierId);

  const tierIndex = categoryDefinition.tiers.findIndex((tier) => tier.tierId === tierId);
  return Math.round(categoryDefinition.baseCost * (categoryDefinition.growthRate ** tierIndex));
}

function getBaseClickPower(state) {
  if (typeof state.baseClickPower === "number") {
    return state.baseClickPower;
  }

  if (typeof state.clickPower === "number") {
    return state.clickPower;
  }

  return 1;
}

function getBaseCps(state) {
  if (typeof state.baseCps === "number") {
    return state.baseCps;
  }

  if (typeof state.cps === "number") {
    return state.cps;
  }

  return 0;
}

function getOwnedUpgradeMultiplier(upgrades, categoryId) {
  return upgrades
    .filter((upgrade) => upgrade.categoryId === categoryId)
    .reduce((multiplier, upgrade) => multiplier * getTierDefinition(categoryId, upgrade.tierId).multiplier, 1);
}

function getEngineDisplay(upgrades) {
  const ownedEngineUpgrades = upgrades.filter((upgrade) => upgrade.categoryId === "engine");

  if (ownedEngineUpgrades.length === 0) {
    return undefined;
  }

  const highestTier = ownedEngineUpgrades.reduce((highest, upgrade) => (upgrade.tierId > highest.tierId ? upgrade : highest));
  return getTierDefinition("engine", highestTier.tierId).display;
}

function getClickPower(state) {
  const upgrades = state.upgrades || [];
  const baseClickPower = getBaseClickPower(state);
  const admissionMultiplier = getOwnedUpgradeMultiplier(upgrades, "admission");
  const exhaustMultiplier = getOwnedUpgradeMultiplier(upgrades, "exhaust");

  return baseClickPower * admissionMultiplier * exhaustMultiplier;
}

function getPassiveCps(state) {
  const upgrades = state.upgrades || [];
  const baseCps = getBaseCps(state);
  const fuelMultiplier = getOwnedUpgradeMultiplier(upgrades, "fuel");
  const engineMultiplier = getOwnedUpgradeMultiplier(upgrades, "engine");

  return baseCps * fuelMultiplier * engineMultiplier;
}

function buyUpgrade(state, categoryId, tierId) {
  const categoryDefinition = getCategoryDefinition(categoryId);
  getTierDefinition(categoryId, tierId);
  const upgrades = state.upgrades || [];
  const alreadyOwned = upgrades.some((upgrade) => upgrade.categoryId === categoryId && upgrade.tierId === tierId);

  if (alreadyOwned) {
    throw createUpgradeError("ALREADY_OWNED", `Upgrade already owned: ${categoryId}:${tierId}`);
  }

  const cost = getPurchaseCost(categoryId, tierId);

  if ((state.horses || 0) < cost) {
    throw createUpgradeError("INSUFFICIENT_FUNDS", `Need ${cost} horses to buy ${categoryId}:${tierId}`);
  }

  const nextUpgrades = [
    ...upgrades,
    {
      categoryId,
      tierId,
      purchasedAt: new Date().toISOString(),
    },
  ];

  const baseClickPower = getBaseClickPower(state);
  const baseCps = getBaseCps(state);

  return {
    ...state,
    horses: (state.horses || 0) - cost,
    upgrades: nextUpgrades,
    baseClickPower,
    baseCps,
    clickPower: getClickPower({ ...state, upgrades: nextUpgrades, baseClickPower }),
    cps: getPassiveCps({ ...state, upgrades: nextUpgrades, baseCps }),
    engineDisplay: categoryDefinition.effect === "cps" && categoryId === "engine" ? getEngineDisplay(nextUpgrades) : state.engineDisplay,
  };
}

module.exports = {
  UPGRADE_CATALOG,
  buyUpgrade,
  getClickPower,
  getPassiveCps,
  getPurchaseCost,
};