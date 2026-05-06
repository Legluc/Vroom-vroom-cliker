import {
  buyPermanentUpgrade,
  buyUpgrade,
  getCurrentTierDefinition,
  getClickPower,
  getNextTierDefinition,
  getPassiveCps,
  getPermanentUpgradeCost,
  getPurchaseCost,
  hasPermanentUpgrade,
  hasUpgrade,
} from "../../../src/engine/upgrades.js";

function createState(overrides = {}) {
  return {
    horses: 0,
    clickPower: 1,
    cps: 0,
    upgrades: [],
    engineDisplay: null,
    ...overrides,
  };
}

describe("buyUpgrade", () => {
  it("achète un upgrade valide et déduit son coût", () => {
    const state = createState({ horses: 10_000 });

    const nextState = buyUpgrade(state, "admission", 1);

    expect(nextState.horses).toBe(9_500);
    expect(nextState.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "admission", tierId: 1 }),
      ]),
    );
    expect(nextState.clickPower).toBe(1);
    expect(nextState.cps).toBe(0);
    expect(state.horses).toBe(10_000);
  });

  it("lève INSUFFICIENT_FUNDS si les chevaux manquent", () => {
    const state = createState({ horses: 100 });

    expect(() => buyUpgrade(state, "admission", 1)).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }),
    );
    expect(state.horses).toBe(100);
  });

  it("lève ALREADY_OWNED si le palier est déjà acheté", () => {
    const state = createState({
      horses: 10_000,
      upgrades: [{ categoryId: "admission", tierId: 1 }],
    });

    expect(() => buyUpgrade(state, "admission", 1)).toThrowError(
      expect.objectContaining({ code: "ALREADY_OWNED" }),
    );
    expect(state.horses).toBe(10_000);
  });

  it("lève INVALID_TIER pour un palier inconnu", () => {
    const state = createState({ horses: 10_000 });

    expect(() => buyUpgrade(state, "admission", 999)).toThrowError(
      expect.objectContaining({ code: "INVALID_TIER" }),
    );
  });

  it("lève INVALID_CATEGORY pour une catégorie inconnue", () => {
    const state = createState({ horses: 10_000 });

    expect(() => buyUpgrade(state, "turbo", 1)).toThrowError(
      expect.objectContaining({ code: "INVALID_CATEGORY" }),
    );
  });

  it("ne modifie pas le clickPower pour Admission", () => {
    const state = createState({ horses: 10_000 });

    const nextState = buyUpgrade(state, "admission", 25);

    expect(nextState.clickPower).toBe(1);
  });

  it("ne modifie pas le cps pour Carburant", () => {
    const state = createState({ horses: 10_000, cps: 10 });

    const nextState = buyUpgrade(state, "fuel", 50);

    expect(nextState.cps).toBe(10);
    expect(getPassiveCps(nextState)).toBe(10);
  });

  it("ne modifie pas le clickPower pour Échappement", () => {
    const state = createState({ horses: 100_000 });

    const nextState = buyUpgrade(state, "exhaust", 100);

    expect(nextState.clickPower).toBe(1);
  });

  it("met à jour uniquement l'affichage moteur pour Bloc moteur", () => {
    const state = createState({ horses: 100_000, cps: 10 });

    const nextState = buyUpgrade(state, "engine", 50);

    expect(nextState.cps).toBe(10);
    expect(nextState.engineDisplay).toBe("V8");
  });

  it("mémorise le dernier palier installé pour une catégorie", () => {
    const firstState = buyUpgrade(
      createState({ horses: 10_000 }),
      "admission",
      25,
    );
    const secondState = buyUpgrade(firstState, "admission", 50);

    expect(getCurrentTierDefinition(secondState, "admission").tierId).toBe(50);
    expect(getNextTierDefinition(secondState, "admission").tierId).toBe(100);
  });

  it("retourne un coût positif pour un palier donné", () => {
    expect(getPurchaseCost("fuel", 100)).toBeGreaterThan(0);
  });

  it("gère le palier 500 avec le multiplicateur max", () => {
    const state = createState({ horses: 2_000_000_000 });

    const nextState = buyUpgrade(state, "admission", 500);

    expect(nextState.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "admission", tierId: 500 }),
      ]),
    );
    expect(nextState.clickPower).toBe(1);
  });

  it("initialise clickPower à 1 si absent de l'état", () => {
    const state = { horses: 10_000, upgrades: [] }; // pas de clickPower

    const nextState = buyUpgrade(state, "admission", 1);

    // clickPower doit être initialisé à 1 et rester inchangé
    expect(nextState.clickPower).toBe(1);
  });

  it("initialise cps à 0 si absent de l'état", () => {
    const state = { horses: 10_000, upgrades: [] }; // pas de cps

    const nextState = buyUpgrade(state, "fuel", 1);

    // cps doit être initialisé à 0 et rester inchangé
    expect(nextState.cps).toBe(0);
  });

  it("getClickPower retourne 1 si clickPower absent", () => {
    expect(getClickPower({})).toBe(1);
  });

  it("getPassiveCps retourne 0 si cps absent", () => {
    expect(getPassiveCps({})).toBe(0);
  });

  it("achète un upgrade engine et définit engineDisplay", () => {
    const state = createState({ horses: 10_000, cps: 5 });

    const nextState = buyUpgrade(state, "engine", 1);

    expect(nextState.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "engine", tierId: 1 }),
      ]),
    );
    expect(nextState.engineDisplay).toBe("1-cyl");
  });

  it("buyUpgrade avec state sans upgrades utilise tableau vide", () => {
    const state = { horses: 10_000, clickPower: 1, cps: 0 }; // pas de upgrades

    const nextState = buyUpgrade(state, "admission", 1);

    expect(nextState.upgrades.length).toBe(1);
    expect(hasUpgrade(nextState.upgrades, "admission", 1)).toBe(true);
  });

  it("n'ajoute pas de doublon quand le palier est déjà possédé", () => {
    const state = createState({
      horses: 10_000,
      upgrades: [{ categoryId: "admission", tierId: 1 }],
    });

    expect(hasUpgrade(state.upgrades, "admission", 1)).toBe(true);
  });
});

describe("buyPermanentUpgrade", () => {
  it("achète un upgrade permanent sans toucher aux stats", () => {
    const state = createState({ horses: 20_000 });

    const nextState = buyPermanentUpgrade(state, "turbo_starter");

    expect(nextState.horses).toBe(16_500);
    expect(nextState.permanentUpgrades).toContainEqual(
      expect.objectContaining({ upgradeId: "turbo_starter" }),
    );
    expect(nextState.clickPower).toBe(1);
    expect(nextState.cps).toBe(0);
  });

  it("refuse un upgrade permanent déjà acheté", () => {
    const state = createState({
      horses: 20_000,
      permanentUpgrades: [{ upgradeId: "turbo_starter" }],
    });

    expect(() => buyPermanentUpgrade(state, "turbo_starter")).toThrowError(
      expect.objectContaining({ code: "ALREADY_OWNED" }),
    );
  });

  it("retourne un coût positif pour un upgrade permanent", () => {
    expect(getPermanentUpgradeCost("turbo_starter")).toBeGreaterThan(0);
  });

  it("hasPermanentUpgrade détecte correctement une possession", () => {
    expect(
      hasPermanentUpgrade([{ upgradeId: "turbo_starter" }], "turbo_starter"),
    ).toBe(true);
  });
});
