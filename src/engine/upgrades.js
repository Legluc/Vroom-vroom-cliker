const UPGRADE_CATALOG = {
  admission: {
    tiers: {
      1: {
        cost: 500,
        clickPowerMultiplier: 1,
        display: "Filtre en papier usé",
      },
      25: { cost: 2500, clickPowerMultiplier: 1.5, display: "Conduit sport" },
      50: {
        cost: 5000,
        clickPowerMultiplier: 2.5,
        display: "Entrée d'air sur le capot",
      },
      100: {
        cost: 12500,
        clickPowerMultiplier: 5,
        display: "Aspirateur industriel (bricolé)",
      },
      250: {
        cost: 35000,
        clickPowerMultiplier: 15,
        display: "Turbine (type avion)",
      },
      500: {
        cost: 100000,
        clickPowerMultiplier: 50,
        display: "Aspirateur de matière noire",
      },
    },
  },
  fuel: {
    tiers: {
      1: { cost: 750, cpsMultiplier: 1, display: "Sans Plomb 95 (dilué)" },
      25: { cost: 3500, cpsMultiplier: 1.5, display: "Sans Plomb 98" },
      50: { cost: 7500, cpsMultiplier: 3, display: "Méthanol 85" },
      100: { cost: 20000, cpsMultiplier: 8, display: "Carburant de fusée" },
      250: { cost: 60000, cpsMultiplier: 25, display: "Plutonium enrichi" },
      500: {
        cost: 160000,
        cpsMultiplier: 100,
        display: "Jus de dinosaure concentré ×200",
      },
    },
  },
  exhaust: {
    tiers: {
      1: { cost: 600, clickPowerMultiplier: 1, display: "Pot percé (Twingo)" },
      25: {
        cost: 3000,
        clickPowerMultiplier: 2,
        display: 'Ligne complète inox "Full Tube"',
      },
      50: {
        cost: 6500,
        clickPowerMultiplier: 4,
        display: "Lance-flammes intégré",
      },
      100: {
        cost: 8000,
        clickPowerMultiplier: 10,
        display: "Orgue / cracheur de feu",
      },
      250: {
        cost: 42000,
        clickPowerMultiplier: 30,
        display: "Trompette surpuissante",
      },
      500: {
        cost: 120000,
        clickPowerMultiplier: 100,
        display: "Propulseur de navette spatiale",
      },
    },
  },
  engine: {
    tiers: {
      1: {
        cost: 1000,
        cpsMultiplier: 1,
        engineDisplay: "1-cyl",
        display: "Moteur de tondeuse (monocylindre)",
      },
      25: {
        cost: 5000,
        cpsMultiplier: 3,
        engineDisplay: "4-cyl",
        display: "4 cylindres en ligne",
      },
      50: {
        cost: 9000,
        cpsMultiplier: 7,
        engineDisplay: "V8",
        display: "Moteur V8 américain",
      },
      100: {
        cost: 30000,
        cpsMultiplier: 20,
        engineDisplay: "V10",
        display: "V10 (Bugatti)",
      },
      250: {
        cost: 90000,
        cpsMultiplier: 60,
        engineDisplay: "V12",
        display: "V12 (prend la moitié de la voiture)",
      },
      500: {
        cost: 250000,
        cpsMultiplier: 200,
        engineDisplay: "RÉACTEUR",
        display: "Réacteur/rotor expérimental",
      },
    },
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

function getPurchaseCost(categoryId, tierId) {
  return getTierDefinition(categoryId, tierId).cost;
}

function hasUpgrade(upgrades, categoryId, tierId) {
  return upgrades.some(
    (upgrade) => upgrade.categoryId === categoryId && upgrade.tierId === tierId,
  );
}

function applyUpgradeEffects(state, categoryId, tierDefinition) {
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

  if (categoryId === "admission" || categoryId === "exhaust") {
    nextState.clickPower *= tierDefinition.clickPowerMultiplier;
  }

  if (categoryId === "fuel" || categoryId === "engine") {
    nextState.cps *= tierDefinition.cpsMultiplier;
  }

  if (categoryId === "engine") {
    nextState.engineDisplay = tierDefinition.engineDisplay;
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

  const nextState = applyUpgradeEffects(state, categoryId, tierDefinition);

  nextState.horses = (state.horses ?? 0) - tierDefinition.cost;
  nextState.upgrades.push({
    categoryId,
    tierId,
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

export {
  buyUpgrade,
  getClickPower,
  getPassiveCps,
  getPurchaseCost,
  UPGRADE_CATALOG,
};
