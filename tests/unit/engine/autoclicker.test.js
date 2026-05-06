import { describe, it, expect, beforeEach } from "vitest";
import { createDefaultState } from "../../../src/engine/state.js";
import {
  buyAutoclicker,
  upgradeAutoclicker,
  getTotalCps,
  applyTick,
  getUpgradeCost,
} from "../../../src/engine/autoclicker.js";

describe("engine/autoclicker.js", () => {
  // SCENARIO AC-01 — Achat d'un autoclicker
  it("AC-01: achat d'un autoclicker déduit le coût en chevaux", () => {
    const state = createDefaultState();
    state.horses = 5000;

    const newState = buyAutoclicker(state, "basic");

    expect(newState.horses).toBe(4000);
    expect(newState.autoclickers).toHaveLength(1);
    expect(newState.autoclickers[0].id).toBe("basic");
    expect(newState.autoclickers[0].level).toBe(1);
    expect(newState.autoclickers[0].active).toBe(true);
  });

  // Achat d'un deuxième autoclicker (autre type)
  it("AC-01b: achat de plusieurs types d'autoclickers", () => {
    const state = createDefaultState();
    state.horses = 10000;

    let newState = buyAutoclicker(state, "basic");
    newState = buyAutoclicker(newState, "turbo");

    expect(newState.autoclickers).toHaveLength(2);
    expect(newState.autoclickers[0].id).toBe("basic");
    expect(newState.autoclickers[1].id).toBe("turbo");
  });

  // SCENARIO AC-02 — Achat d'un autoclicker sans fonds
  it("AC-02: achat sans fonds lève une erreur", () => {
    const state = createDefaultState();
    state.horses = 500;

    expect(() => buyAutoclicker(state, "basic")).toThrow("INSUFFICIENT_FUNDS");
    expect(state.autoclickers).toEqual([]);
  });

  // SCENARIO AC-03 — Upgrade d'un autoclicker existant
  it("AC-03: upgrade augmente le niveau et le cps", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 1,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.horses = 5000;

    const newState = upgradeAutoclicker(state, "basic");

    expect(newState.autoclickers[0].level).toBe(2);
    expect(newState.autoclickers[0].cps).toBeGreaterThan(1);
    expect(newState.horses).toBeLessThan(5000);
  });

  // SCENARIO AC-04 — Upgrade d'un autoclicker inexistant
  it("AC-04: upgrade d'un autoclicker inexistant lève une erreur", () => {
    const state = createDefaultState();
    state.autoclickers = [];

    expect(() => upgradeAutoclicker(state, "nonexistent")).toThrow(
      "AUTOCLICKER_NOT_FOUND",
    );
  });

  // SCENARIO AC-05 — Calcul du CPS total sans événement
  it("AC-05: getTotalCps retourne la somme des cps sans événement", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 5,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
      {
        id: "turbo",
        level: 1,
        cps: 10,
        active: true,
        costBase: 2000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = null;

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(15);
  });

  // SCENARIO AC-06 — Calcul du CPS avec événement AUTO_CLICK_FRENZY
  it("AC-06: getTotalCps applique le multiplicateur AUTO_CLICK_FRENZY", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 5,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
      {
        id: "turbo",
        level: 1,
        cps: 5,
        active: true,
        costBase: 2000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "AUTO_CLICK_FRENZY",
      multiplier: 2,
      expiresAt: Date.now() + 10000,
      requiresAction: false,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(20); // 10 × 2
  });

  // SCENARIO AC-07 — CPS avec autoclickers en pause (AUTOCLICKER_PAUSE)
  it("AC-07: getTotalCps retourne 0 avec AUTOCLICKER_PAUSE actif", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 5,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
      {
        id: "turbo",
        level: 1,
        cps: 5,
        active: true,
        costBase: 2000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "AUTOCLICKER_PAUSE",
      multiplier: 0,
      expiresAt: Date.now() + 10000,
      requiresAction: false,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(0);
  });

  // SCENARIO AC-08 — Tick passif
  it("AC-08: applyTick ajoute les chevaux passifs", () => {
    const state = createDefaultState();
    state.horses = 0;
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 5,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.lastTickAt = Date.now() - 1000; // il y a 1 seconde

    const now = Date.now();
    const newState = applyTick(state, now);

    // Après 1 seconde avec 5 cps, devrait gagner ~5 chevaux
    expect(newState.horses).toBeGreaterThanOrEqual(4); // tolérance
    expect(newState.horses).toBeLessThanOrEqual(6);
    expect(newState.lastTickAt).toBe(now);
  });

  // SCENARIO AC-09 — Tick sans autoclickers
  it("AC-09: applyTick ne change pas horses si pas d'autoclickers", () => {
    const state = createDefaultState();
    state.horses = 100;
    state.autoclickers = [];
    state.lastTickAt = Date.now() - 2000;

    const now = Date.now();
    const newState = applyTick(state, now);

    expect(newState.horses).toBe(100);
    expect(newState.lastTickAt).toBe(now);
  });

  // SCENARIO AC-10 — Coût d'upgrade croissant
  it("AC-10: getUpgradeCost retourne un coût croissant selon la formule", () => {
    const autoclicker = {
      id: "basic",
      level: 1,
      cps: 1,
      active: true,
      costBase: 1000,
      costGrowthRate: 1.15,
    };

    const cost = getUpgradeCost(autoclicker);

    // costBase × costGrowthRate^level = 1000 × 1.15^1
    expect(cost).toBe(1000 * 1.15);
  });

  // Test coût d'upgrade au niveau 2
  it("AC-10b: getUpgradeCost au niveau 2", () => {
    const autoclicker = {
      id: "basic",
      level: 2,
      cps: 1.15,
      active: true,
      costBase: 1000,
      costGrowthRate: 1.15,
    };

    const cost = getUpgradeCost(autoclicker);

    // costBase × costGrowthRate^level = 1000 × 1.15^2
    expect(cost).toBeCloseTo(1000 * 1.15 * 1.15, 2);
  });

  // Test CPS n'augmente pas si événement expiré
  it("AC-05b: getTotalCps nettoie les événements expirés", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 10,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "AUTO_CLICK_FRENZY",
      multiplier: 2,
      expiresAt: Date.now() - 1000, // expiré
      requiresAction: false,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(10); // sans multiplicateur
  });

  // Premier tick sans lastTickAt — branche ligne 174
  it("applyTick sans lastTickAt retourne l'état avec lastTickAt initialisé", () => {
    const state = createDefaultState();
    state.horses = 100;
    state.lastTickAt = null;

    const now = Date.now();
    const newState = applyTick(state, now);

    expect(newState.horses).toBe(100); // pas de gain au premier tick
    expect(newState.lastTickAt).toBe(now);
  });

  // upgradeAutoclicker avec plusieurs autoclickers — couvre la branche return a
  it("upgradeAutoclicker met à niveau seulement l'autoclicker ciblé", () => {
    let state = createDefaultState();
    state.horses = 10000;
    state = buyAutoclicker(state, "basic");
    state = buyAutoclicker(state, "turbo");
    state.horses = 10000;

    const newState = upgradeAutoclicker(state, "basic");

    const basic = newState.autoclickers.find((a) => a.id === "basic");
    const turbo = newState.autoclickers.find((a) => a.id === "turbo");
    expect(basic.level).toBe(2);
    expect(turbo.level).toBe(1); // inchangé
  });
});
