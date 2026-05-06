const { buyUpgrade, getClickPower, getPassiveCps, getPurchaseCost } = require("../../../src/engine/upgrades");

function createState(overrides = {}) {
  return {
    horses: 0,
    clickPower: 1,
    cps: 0,
    upgrades: [],
    ...overrides,
  };
}

function expectUpgradeError(fn, code) {
  try {
    fn();
    throw new Error("Expected an error to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  }
}

describe("buyUpgrade", () => {
  it("déduit le coût en chevaux et ajoute l'upgrade", () => {
    const state = createState({ horses: 10_000 });

    const result = buyUpgrade(state, "admission", 1);

    expect(result.horses).toBe(9_500);
    expect(result.upgrades).toEqual([
      expect.objectContaining({ categoryId: "admission", tierId: 1 }),
    ]);
    expect(state.horses).toBe(10_000);
    expect(state.upgrades).toEqual([]);
  });

  it("lance une erreur si fonds insuffisants", () => {
    const state = createState({ horses: 100 });

    expectUpgradeError(() => buyUpgrade(state, "admission", 1), "INSUFFICIENT_FUNDS");
    expect(state.horses).toBe(100);
    expect(state.upgrades).toEqual([]);
  });

  it("lance une erreur si palier déjà possédé", () => {
    const state = createState({
      horses: 10_000,
      upgrades: [{ categoryId: "admission", tierId: 1, purchasedAt: "2026-05-06T00:00:00.000Z" }],
    });

    expectUpgradeError(() => buyUpgrade(state, "admission", 1), "ALREADY_OWNED");
    expect(state.horses).toBe(10_000);
  });

  it("lance une erreur si palier inexistant", () => {
    const state = createState({ horses: 10_000 });

    expectUpgradeError(() => buyUpgrade(state, "admission", 999), "INVALID_TIER");
  });

  it("lance une erreur si catégorie inconnue", () => {
    const state = createState({ horses: 10_000 });

    expectUpgradeError(() => buyUpgrade(state, "turbo", 1), "INVALID_CATEGORY");
  });

  it("met à jour clickPower pour Admission", () => {
    const state = createState({ horses: 10_000 });

    const result = buyUpgrade(state, "admission", 25);

    expect(result.clickPower).toBe(1.5);
  });

  it("met à jour le cps pour Carburant", () => {
    const state = createState({ horses: 10_000, cps: 10 });

    const result = buyUpgrade(state, "fuel", 50);

    expect(getPassiveCps(result)).toBe(30);
  });

  it("met à jour clickPower pour Échappement", () => {
    const state = createState({ horses: 20_000 });

    const result = buyUpgrade(state, "exhaust", 100);

    expect(result.clickPower).toBe(10);
  });

  it("met à jour le type de moteur et le cps", () => {
    const state = createState({ horses: 10_000, cps: 10 });

    const result = buyUpgrade(state, "engine", 50);

    expect(getPassiveCps(result)).toBe(70);
    expect(result.engineDisplay).toBe("V8");
  });

  it("cumule plusieurs upgrades sur clickPower", () => {
    const state = createState({
      upgrades: [
        { categoryId: "admission", tierId: 25, purchasedAt: "2026-05-06T00:00:00.000Z" },
        { categoryId: "exhaust", tierId: 25, purchasedAt: "2026-05-06T00:00:00.000Z" },
      ],
    });

    expect(getClickPower(state)).toBe(3);
  });

  it("retourne un coût valide pour le palier Carburant Niv 100", () => {
    const cost = getPurchaseCost("fuel", 100);

    expect(typeof cost).toBe("number");
    expect(cost).toBeGreaterThan(0);
  });

  it("permet l'achat du palier 500", () => {
    const state = createState({ horses: 1_000_000_000 });

    const result = buyUpgrade(state, "admission", 500);

    expect(result.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "admission", tierId: 500 }),
      ])
    );
    expect(result.clickPower).toBe(50);
  });
});