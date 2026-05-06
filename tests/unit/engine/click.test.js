import { describe, it, expect } from "vitest";
import { createDefaultState } from "../../../src/engine/state.js";
import { processClick } from "../../../src/engine/click.js";

describe("engine/click.js", () => {
  // SCENARIO CL-01 — Clic de base
  it("CL-01: clic de base ajoute clickPower aux chevaux", () => {
    const state = createDefaultState();
    const newState = processClick(state);

    expect(newState.horses).toBe(1);
    expect(newState.totalHorsesEarned).toBe(1);
  });

  // SCENARIO CL-02 — Clic avec clickPower élevé
  it("CL-02: clic avec clickPower élevé", () => {
    const state = createDefaultState();
    state.horses = 100;
    state.clickPower = 50;

    const newState = processClick(state);

    expect(newState.horses).toBe(150);
    expect(newState.totalHorsesEarned).toBe(50);
  });

  // SCENARIO CL-03 — Clic avec événement GOLDEN_TURBO actif
  it("CL-03: clic avec GOLDEN_TURBO actif applique le multiplicateur", () => {
    const state = createDefaultState();
    state.clickPower = 10;
    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: Date.now() + 10000, // expiré dans 10 secondes
      requiresAction: false,
    };

    const newState = processClick(state);

    expect(newState.horses).toBe(30); // 10 × 3
    expect(newState.totalHorsesEarned).toBe(30);
  });

  // SCENARIO CL-04 — Clic avec événement GOLDEN_TURBO expiré
  it("CL-04: clic avec GOLDEN_TURBO expiré ne s'applique pas", () => {
    const state = createDefaultState();
    state.clickPower = 10;
    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: Date.now() - 1000, // expiré il y a 1 seconde
      requiresAction: false,
    };

    const newState = processClick(state);

    expect(newState.horses).toBe(10); // sans multiplicateur
    expect(newState.totalHorsesEarned).toBe(10);
    expect(newState.activeEvent).toBeNull(); // événement supprimé
  });

  // SCENARIO CL-05 — Clic sans modifier les autoclickers
  it("CL-05: les autoclickers ne sont pas modifiés lors d'un clic", () => {
    const state = createDefaultState();
    state.autoclickers = [
      { id: 1, level: 1, cps: 1, active: true },
      { id: 2, level: 2, cps: 2, active: true },
    ];

    const newState = processClick(state);

    expect(newState.autoclickers).toEqual(state.autoclickers);
  });

  // SCENARIO CL-06 — Clic avec POLICE_CONTROL actif
  it("CL-06: POLICE_CONTROL bloque le clic (production = 0)", () => {
    const state = createDefaultState();
    state.horses = 100;
    state.clickPower = 50;
    state.activeEvent = {
      type: "POLICE_CONTROL",
      multiplier: 0,
      expiresAt: Date.now() + 10000,
      requiresAction: true,
    };

    const newState = processClick(state);

    expect(newState.horses).toBe(100); // inchangé
    expect(newState.totalHorsesEarned).toBe(0); // inchangé
  });

  // SCENARIO CL-07 — Immutabilité de l'état source
  it("CL-07: l'état source n'est pas muté", () => {
    const state = createDefaultState();
    state.horses = 0;

    const newState = processClick(state);

    expect(state.horses).toBe(0); // inchangé
    expect(newState.horses).toBe(1); // nouveau
    expect(state === newState).toBe(false); // objets différents
  });
});
