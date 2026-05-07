import { describe, it, expect } from "vitest";
import {
  createDefaultState,
  serializeState,
  deserializeState,
  mergeWithDefaults,
} from "../../../src/engine/state.js";

describe("engine/state.js", () => {
  describe("createDefaultState", () => {
    it("crée un état initial sans paramètre", () => {
      const state = createDefaultState();
      expect(state.userId).toBeNull();
      expect(state.horses).toBe(0);
      expect(state.totalHorsesEarned).toBe(0);
      expect(state.clickPower).toBe(1);
      expect(state.buildings).toEqual({});
      expect(state.unlockedUpgrades).toEqual([]);
      expect(state.currentPassiveCps).toBe(0);
      expect(state.autoclickers).toEqual([]);
      expect(state.activeEvent).toBeNull();
    });

    it("crée un état avec userId défini", () => {
      const state = createDefaultState(42);
      expect(state.userId).toBe(42);
      expect(state.buildings).toEqual({});
      expect(state.unlockedUpgrades).toEqual([]);
    });
  });

  describe("serializeState", () => {
    it("sérialise un GameState valide en JSON", () => {
      const state = createDefaultState();
      state.horses = 1500;
      const json = serializeState(state);

      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(parsed.horses).toBe(1500);
    });
  });

  describe("deserializeState", () => {
    it("désérialise une chaîne JSON valide en GameState complet", () => {
      const state = createDefaultState();
      state.horses = 2000;
      state.userId = 5;
      const json = serializeState(state);

      const deserialized = deserializeState(json);
      expect(deserialized.horses).toBe(2000);
      expect(deserialized.userId).toBe(5);
      expect(deserialized.totalHorsesEarned).toBe(0);
      expect(deserialized.clickPower).toBe(1);
      expect(deserialized.buildings).toEqual({});
      expect(deserialized.unlockedUpgrades).toEqual([]);
      expect(deserialized.currentPassiveCps).toBe(0);
      expect(deserialized.activeEvent).toBeNull();
    });

    it("lève une SyntaxError si le JSON est malformé", () => {
      const invalidJson = "{ horses: 500 }";
      expect(() => deserializeState(invalidJson)).toThrow(SyntaxError);
    });
  });

  describe("mergeWithDefaults", () => {
    it("fusionne un état partiel avec les valeurs par défaut", () => {
      const partialState = { horses: 500 };
      const merged = mergeWithDefaults(partialState);

      expect(merged.horses).toBe(500);
      expect(merged.totalHorsesEarned).toBe(0);
      expect(merged.clickPower).toBe(1);
      expect(merged.buildings).toEqual({});
      expect(merged.unlockedUpgrades).toEqual([]);
      expect(merged.currentPassiveCps).toBe(0);
      expect(merged.activeEvent).toBeNull();
      expect(merged.userId).toBeNull();
    });

    it("remplit les propriétés manquantes pour une ancienne sauvegarde", () => {
      const oldSave = {
        horses: 1000,
        totalHorsesEarned: 2000,
        clickPower: 5,
      };
      const merged = mergeWithDefaults(oldSave);

      expect(merged.horses).toBe(1000);
      expect(merged.totalHorsesEarned).toBe(2000);
      expect(merged.clickPower).toBe(5);
      expect(merged.buildings).toEqual({});
      expect(merged.unlockedUpgrades).toEqual([]);
      expect(merged.currentPassiveCps).toBe(0);
      expect(merged.activeEvent).toBeNull();
    });
  });
});
