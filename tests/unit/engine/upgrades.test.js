import { describe, it, expect } from "vitest";
import {
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
  recalculateCachedStats,
} from "../../../src/engine/upgrades.js";

function createState(overrides = {}) {
  return {
    horses: 0,
    clickPower: 1,
    buildings: {},
    unlockedUpgrades: [],
    currentPassiveCps: 0,
    ...overrides,
  };
}

describe("engine/upgrades.js", () => {
  it("calcule le coût exponentiel d'un bâtiment", () => {
    const state = createState({ buildings: { stagiaire: 1 } });

    expect(getBuildingCost("stagiaire", state)).toBe(18);
  });

  it("achète un bâtiment et met à jour le cache passif", () => {
    const state = createState({ horses: 100, buildings: {} });

    const nextState = buyBuilding(state, "stagiaire");

    expect(nextState.horses).toBe(85);
    expect(nextState.buildings.stagiaire).toBe(1);
    expect(nextState.currentPassiveCps).toBeCloseTo(0.1);
    expect(nextState.clickPower).toBe(1);
  });

  it("refuse l'achat d'un bâtiment sans fonds suffisants", () => {
    const state = createState({ horses: 10 });

    expect(() => buyBuilding(state, "garage")).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }),
    );
  });

  it("calcule le CPS réel d'un bâtiment avec multiplicateur ciblé", () => {
    const state = createState({
      buildings: { stagiaire: 10 },
      unlockedUpgrades: ["formation_acceleree"],
    });

    expect(calculateBuildingCps("stagiaire", state)).toBeCloseTo(2);
  });

  it("calcule le CPS réel d'un bâtiment avec multiplicateur global", () => {
    const state = createState({
      buildings: { stagiaire: 10, garage: 5 },
      unlockedUpgrades: ["atelier_optimise"],
    });

    expect(calculateBuildingCps("stagiaire", state)).toBeCloseTo(1.25);
    expect(calculateBuildingCps("garage", state)).toBeCloseTo(50);
  });

  it("achète une upgrade one-off et bloque les doublons", () => {
    const state = createState({ horses: 10_000, buildings: { stagiaire: 10 } });

    const nextState = buyUpgrade(state, "formation_acceleree");

    expect(nextState.horses).toBe(8_800);
    expect(nextState.unlockedUpgrades).toContain("formation_acceleree");
    expect(() => buyUpgrade(nextState, "formation_acceleree")).toThrowError(
      expect.objectContaining({ code: "ALREADY_OWNED" }),
    );
  });

  it("refuse une upgrade tant que ses conditions ne sont pas remplies", () => {
    const state = createState({ horses: 10_000, buildings: { stagiaire: 5 } });

    expect(() => buyUpgrade(state, "formation_acceleree")).toThrowError(
      expect.objectContaining({ code: "UPGRADE_LOCKED" }),
    );
  });

  it("applique les bonus de clic en cascade", () => {
    const state = createState({
      unlockedUpgrades: ["cle_a_chocs", "pole_position"],
      buildings: { f1: 1 },
    });

    const recalculated = recalculateCachedStats(state);

    expect(getClickPower(recalculated)).toBe(10);
  });

  it("retourne le CPS passif en cache", () => {
    const state = createState({ currentPassiveCps: 123.45 });

    expect(getPassiveCps(state)).toBe(123.45);
  });

  it("retourne les upgrades disponibles selon les conditions", () => {
    const state = createState({
      buildings: { stagiaire: 10, garage: 5 },
      unlockedUpgrades: ["cle_a_chocs"],
    });

    const available = getAvailableUpgrades(state).map((upgrade) => upgrade.id);

    expect(available).toContain("formation_acceleree");
    expect(available).toContain("atelier_optimise");
    expect(available).not.toContain("cle_a_chocs");
  });

  it("dispatch la bonne logique d'achat selon le type", () => {
    const state = createState({ horses: 100, buildings: {} });

    const nextState = buyPurchase(state, "building", "stagiaire");

    expect(nextState.buildings.stagiaire).toBe(1);
  });

  it("recalcule les caches à partir de l'état courant", () => {
    const state = createState({
      buildings: { stagiaire: 10 },
      unlockedUpgrades: ["formation_acceleree"],
    });

    const nextState = recalculateCachedStats(state);

    expect(nextState.clickPower).toBe(1);
    expect(nextState.currentPassiveCps).toBeCloseTo(2);
  });

  it("expose les catalogues de bâtiments et d'upgrades", () => {
    expect(BUILDINGS_CATALOG.stagiaire.baseCps).toBe(0.1);
    expect(UPGRADES_CATALOG.cle_a_chocs.effect.type).toBe("click");
  });
});
