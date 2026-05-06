const {
  buyUpgrade,
  getClickPower,
  getPassiveCps,
  getPurchaseCost,
} = require("../../../src/engine/upgrades");

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

  it("applique le multiplicateur clickPower pour Admission", () => {
    const state = createState({ horses: 10_000 });

    const nextState = buyUpgrade(state, "admission", 25);

    expect(nextState.clickPower).toBe(1.5);
  });

  it("applique le multiplicateur cps pour Carburant", () => {
    const state = createState({ horses: 10_000, cps: 10 });

    const nextState = buyUpgrade(state, "fuel", 50);

    expect(nextState.cps).toBe(30);
    expect(getPassiveCps(nextState)).toBe(30);
  });

  it("applique le multiplicateur clickPower pour Échappement", () => {
    const state = createState({ horses: 10_000 });

    const nextState = buyUpgrade(state, "exhaust", 100);

    expect(nextState.clickPower).toBe(10);
  });

  it("applique le multiplicateur cps et le moteur affiché pour Bloc moteur", () => {
    const state = createState({ horses: 10_000, cps: 10 });

    const nextState = buyUpgrade(state, "engine", 50);

    expect(nextState.cps).toBe(70);
    expect(nextState.engineDisplay).toBe("V8");
  });

  it("cumule plusieurs upgrades sur le clickPower", () => {
    const firstState = buyUpgrade(
      createState({ horses: 10_000 }),
      "admission",
      25,
    );
    const secondState = buyUpgrade(firstState, "exhaust", 25);

    expect(getClickPower(secondState)).toBe(3);
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
    expect(nextState.clickPower).toBe(50);
  });
});
