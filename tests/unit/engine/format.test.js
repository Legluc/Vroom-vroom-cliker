const { formatHorses } = require("../../../src/engine/format");

describe("formatHorses", () => {
  it("affiche un entier sous 1000 tel quel", () => {
    expect(formatHorses(999)).toBe("999");
  });

  it("affiche 1000 en 1K", () => {
    expect(formatHorses(1000)).toBe("1K");
  });

  it("affiche 42500 en 42K", () => {
    expect(formatHorses(42500)).toBe("42K");
  });

  it("affiche 1000000 en 1M", () => {
    expect(formatHorses(1_000_000)).toBe("1M");
  });

  it("affiche 750000000 en 750M", () => {
    expect(formatHorses(750_000_000)).toBe("750M");
  });

  it("affiche 1000000000 en 1MM", () => {
    expect(formatHorses(1_000_000_000)).toBe("1MM");
  });

  it("affiche 5200000000 en 5MM", () => {
    expect(formatHorses(5_200_000_000)).toBe("5MM");
  });

  it("gère 0", () => {
    expect(formatHorses(0)).toBe("0");
  });

  it("gère les négatifs", () => {
    expect(formatHorses(-500)).toBe("-500");
  });

  it("tronque les décimales sous 1000", () => {
    expect(formatHorses(99.7)).toBe("99");
  });

  it("lance une TypeError pour NaN", () => {
    expect(() => formatHorses(Number.NaN)).toThrow(TypeError);
  });
});
