import {
  calculateCommission,
  calculateObjectifProgression,
  split50,
} from "../../src/utils/finance";

describe("calculateCommission", () => {
  it("calcule le % de la réparation", () => {
    expect(calculateCommission(10000, 40)).toBe(4000);
  });

  it("50 %", () => {
    expect(calculateCommission(5000, 50)).toBe(2500);
  });

  it("montant nul → 0", () => {
    expect(calculateCommission(0, 40)).toBe(0);
  });

  it("pourcentage nul → 0", () => {
    expect(calculateCommission(10000, 0)).toBe(0);
  });

  it("pourcentage décimal", () => {
    expect(calculateCommission(1000, 33.33)).toBeCloseTo(333.3, 1);
  });
});

describe("split50", () => {
  it("partage pair", () => {
    expect(split50(10000)).toEqual([5000, 5000]);
  });

  it("partage impair (centimes exacts)", () => {
    expect(split50(1001)).toEqual([500.5, 500.5]);
  });

  it("partage avec centimes (reste sur la 2e part)", () => {
    const [p1, p2] = split50(1000.01);
    expect(p1 + p2).toBeCloseTo(1000.01, 2);
  });

  it("somme toujours exacte", () => {
    const [p1, p2] = split50(12345.67);
    expect(Math.round((p1 + p2) * 100)).toBe(1234567);
  });
});

describe("calculateObjectifProgression", () => {
  it("progression à moitié", () => {
    const p = calculateObjectifProgression(50000, 100000);
    expect(p.cumul).toBe(50000);
    expect(p.reste).toBe(50000);
    expect(p.pourcentage).toBe(50);
  });

  it("objectif atteint", () => {
    const p = calculateObjectifProgression(100000, 100000);
    expect(p.reste).toBe(0);
    expect(p.pourcentage).toBe(100);
  });

  it("dépasse l'objectif → clampé", () => {
    const p = calculateObjectifProgression(120000, 100000);
    expect(p.reste).toBe(0);
    expect(p.pourcentage).toBe(100);
  });

  it("cible nulle → 0 %", () => {
    const p = calculateObjectifProgression(5000, 0);
    expect(p.reste).toBe(0);
    expect(p.pourcentage).toBe(0);
  });
});
