import { describe, it, expect } from "vitest";
import {
  createDefaultState,
  serializeState,
  deserializeState,
  mergeWithDefaults,
} from "../../../src/engine/state.js";

describe("engine/state.js", () => {
  // SCENARIO S-01 — Création d'un état initial
  describe("createDefaultState", () => {
    it("S-01: crée un état initial sans paramètre", () => {
      const state = createDefaultState();
      expect(state.userId).toBeNull();
      expect(state.horses).toBe(0);
      expect(state.totalHorsesEarned).toBe(0);
      expect(state.clickPower).toBe(1);
      expect(state.autoclickers).toEqual([]);
      expect(state.upgrades).toEqual([]);
      expect(state.activeEvent).toBeNull();
    });

    // SCENARIO S-02 — Création d'un état pour un utilisateur
    it("S-02: crée un état avec userId défini", () => {
      const state = createDefaultState(42);
      expect(state.userId).toBe(42);
      expect(state.horses).toBe(0);
      expect(state.totalHorsesEarned).toBe(0);
      expect(state.clickPower).toBe(1);
      expect(state.autoclickers).toEqual([]);
      expect(state.upgrades).toEqual([]);
      expect(state.activeEvent).toBeNull();
    });
  });

  // SCENARIO S-03 — Sérialisation de l'état
  describe("serializeState", () => {
    it("S-03: sérialise un GameState valide en JSON", () => {
      const state = createDefaultState();
      state.horses = 1500;
      const json = serializeState(state);

      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(parsed.horses).toBe(1500);
    });
  });

  // SCENARIO S-04 — Désérialisation de l'état
  describe("deserializeState", () => {
    it("S-04: désérialise une chaîne JSON valide en GameState complet", () => {
      const state = createDefaultState();
      state.horses = 2000;
      state.userId = 5;
      const json = serializeState(state);

      const deserialized = deserializeState(json);
      expect(deserialized.horses).toBe(2000);
      expect(deserialized.userId).toBe(5);
      expect(deserialized.totalHorsesEarned).toBe(0);
      expect(deserialized.clickPower).toBe(1);
      expect(deserialized.autoclickers).toEqual([]);
      expect(deserialized.upgrades).toEqual([]);
      expect(deserialized.activeEvent).toBeNull();
    });
  });

  // SCENARIO S-05 — Désérialisation d'une chaîne invalide
  describe("deserializeState — erreur", () => {
    it("S-05: lève une SyntaxError si le JSON est malformé", () => {
      const invalidJson = "{ horses: 500 }"; // Pas de guillemets
      expect(() => deserializeState(invalidJson)).toThrow(SyntaxError);
    });
  });

  // SCENARIO S-06 — Fusion d'un état partiel avec les valeurs par défaut
  describe("mergeWithDefaults", () => {
    it("S-06: fusionne un état partiel avec les valeurs par défaut", () => {
      const partialState = { horses: 500 };
      const merged = mergeWithDefaults(partialState);

      expect(merged.horses).toBe(500);
      expect(merged.totalHorsesEarned).toBe(0);
      expect(merged.clickPower).toBe(1);
      expect(merged.autoclickers).toEqual([]);
      expect(merged.upgrades).toEqual([]);
      expect(merged.activeEvent).toBeNull();
      expect(merged.userId).toBeNull();
    });

    it("S-06: remplit les propriétés manquantes pour une ancienne sauvegarde", () => {
      const oldSave = {
        horses: 1000,
        totalHorsesEarned: 2000,
        clickPower: 5,
      };
      const merged = mergeWithDefaults(oldSave);

      expect(merged.horses).toBe(1000);
      expect(merged.totalHorsesEarned).toBe(2000);
      expect(merged.clickPower).toBe(5);
      expect(merged.autoclickers).toEqual([]);
      expect(merged.upgrades).toEqual([]);
      expect(merged.activeEvent).toBeNull();
    });
  });
});
