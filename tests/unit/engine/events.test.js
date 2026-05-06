import { describe, it, expect } from "vitest";
import { createDefaultState } from "../../../src/engine/state.js";
import { getTotalCps } from "../../../src/engine/autoclicker.js";
import { processClick } from "../../../src/engine/click.js";
import {
  tryTriggerEvent,
  isEventActive,
  clearExpiredEvent,
  resolveEvent,
} from "../../../src/engine/events.js";

describe("engine/events.js", () => {
  // SCENARIO EV-01 — Déclenchement d'un événement
  it("EV-01: déclenchement d'un événement GOLDEN_TURBO", () => {
    const state = createDefaultState();
    const now = Date.now();

    const newState = tryTriggerEvent(state, "GOLDEN_TURBO", now);

    expect(newState.activeEvent).not.toBeNull();
    expect(newState.activeEvent.type).toBe("GOLDEN_TURBO");
    expect(newState.activeEvent.multiplier).toBe(3);
    expect(newState.activeEvent.requiresAction).toBe(false);
    expect(newState.activeEvent.expiresAt).toBeGreaterThan(now);
    expect(newState.activeEvent.expiresAt).toBeLessThanOrEqual(now + 31000);
  });

  // SCENARIO EV-02 — Pas de déclenchement si événement déjà actif
  it("EV-02: ne déclenche pas si événement déjà actif", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: now + 10000,
      requiresAction: false,
    };

    const newState = tryTriggerEvent(state, "FUEL_SURGE", now);

    expect(newState.activeEvent.type).toBe("GOLDEN_TURBO");
  });

  // SCENARIO EV-03 — Vérification d'un événement actif non expiré
  it("EV-03: isEventActive retourne true si non expiré", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: now + 10000,
      requiresAction: false,
    };

    const result = isEventActive(state, now);

    expect(result).toBe(true);
  });

  // SCENARIO EV-04 — Vérification d'un événement expiré
  it("EV-04: isEventActive retourne false si expiré", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: now - 1,
      requiresAction: false,
    };

    const result = isEventActive(state, now);

    expect(result).toBe(false);
  });

  // SCENARIO EV-05 — Nettoyage d'un événement expiré
  it("EV-05: clearExpiredEvent nettoie les événements expirés", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: now - 1000,
      requiresAction: false,
    };

    const newState = clearExpiredEvent(state, now);

    expect(newState.activeEvent).toBeNull();
  });

  // SCENARIO EV-06 — Résolution d'un événement interactif RADAR_ALERT
  it("EV-06: resolveEvent efface un événement interactif", () => {
    const state = createDefaultState();
    state.activeEvent = {
      type: "RADAR_ALERT",
      multiplier: 0.1,
      expiresAt: Date.now() + 10000,
      requiresAction: true,
    };

    const newState = resolveEvent(state);

    expect(newState.activeEvent).toBeNull();
  });

  // SCENARIO EV-07 — Résolution impossible sans événement actif
  it("EV-07: resolveEvent lève une erreur sans événement", () => {
    const state = createDefaultState();
    state.activeEvent = null;

    expect(() => resolveEvent(state)).toThrow("NO_ACTIVE_EVENT");
  });

  // SCENARIO EV-08 — Résolution d'un événement non-interactif
  it("EV-08: resolveEvent lève une erreur pour non-interactif", () => {
    const state = createDefaultState();
    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: Date.now() + 10000,
      requiresAction: false,
    };

    expect(() => resolveEvent(state)).toThrow("EVENT_NOT_RESOLVABLE");
    expect(state.activeEvent.type).toBe("GOLDEN_TURBO");
  });

  // SCENARIO EV-09 — Effet RADAR_ALERT sur le CPS (multiplicateur 0.1)
  it("EV-09: RADAR_ALERT réduit le CPS à 10%", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 100,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "RADAR_ALERT",
      multiplier: 0.1,
      expiresAt: Date.now() + 10000,
      requiresAction: true,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(10);
  });

  // SCENARIO EV-10 — Effet ENGINE_FAILURE sur le CPS (multiplicateur 0.5)
  it("EV-10: ENGINE_FAILURE réduit le CPS à 50%", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 100,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "ENGINE_FAILURE",
      multiplier: 0.5,
      expiresAt: Date.now() + 10000,
      requiresAction: false,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(50);
  });

  // SCENARIO EV-11 — Effet POLICE_CONTROL bloque production et clics
  it("EV-11: POLICE_CONTROL bloque le clic", () => {
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

    expect(newState.horses).toBe(100);
  });

  it("EV-11b: POLICE_CONTROL bloque le CPS", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 100,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "POLICE_CONTROL",
      multiplier: 0,
      expiresAt: Date.now() + 10000,
      requiresAction: true,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(0);
  });

  // SCENARIO EV-12 — FUEL_SURGE multiplie le CPS (multiplicateur 5)
  it("EV-12: FUEL_SURGE multiplie le CPS par 5", () => {
    const state = createDefaultState();
    state.autoclickers = [
      {
        id: "basic",
        level: 1,
        cps: 20,
        active: true,
        costBase: 1000,
        costGrowthRate: 1.15,
      },
    ];
    state.activeEvent = {
      type: "FUEL_SURGE",
      multiplier: 5,
      expiresAt: Date.now() + 10000,
      requiresAction: false,
    };

    const totalCps = getTotalCps(state);

    expect(totalCps).toBe(100);
  });

  // Test: événement sans activeEvent
  it("EV-03b: isEventActive retourne false sans événement", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = null;

    const result = isEventActive(state, now);

    expect(result).toBe(false);
  });

  // Test: clearExpiredEvent ne change rien si non expiré
  it("EV-05b: clearExpiredEvent laisse les événements non expirés", () => {
    const state = createDefaultState();
    const now = Date.now();

    state.activeEvent = {
      type: "GOLDEN_TURBO",
      multiplier: 3,
      expiresAt: now + 10000,
      requiresAction: false,
    };

    const newState = clearExpiredEvent(state, now);

    expect(newState.activeEvent).not.toBeNull();
    expect(newState.activeEvent.type).toBe("GOLDEN_TURBO");
  });

  // Test: AUTO_CLICK_FRENZY
  it("EV-06b: tryTriggerEvent déclenche AUTO_CLICK_FRENZY", () => {
    const state = createDefaultState();
    const now = Date.now();

    const newState = tryTriggerEvent(state, "AUTO_CLICK_FRENZY", now);

    expect(newState.activeEvent.type).toBe("AUTO_CLICK_FRENZY");
    expect(newState.activeEvent.multiplier).toBe(2);
  });

  // Test: clearExpiredEvent sans activeEvent retourne l'état inchangé
  it("clearExpiredEvent sans activeEvent retourne l'état sans modification", () => {
    const state = createDefaultState();
    state.activeEvent = null;
    const now = Date.now();

    const newState = clearExpiredEvent(state, now);

    expect(newState).toBe(state); // même référence
  });

  // Test: tryTriggerEvent avec type inconnu lève une erreur
  it("tryTriggerEvent avec type inconnu lève UNKNOWN_EVENT", () => {
    const state = createDefaultState();
    const now = Date.now();

    expect(() => tryTriggerEvent(state, "INEXISTANT", now)).toThrow(
      "UNKNOWN_EVENT: INEXISTANT",
    );
  });
});
