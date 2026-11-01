import { formatCurrency, formatDate, formatShortDate } from "../../src/utils/format";

describe("formatCurrency", () => {
  it("formate un montant en DA", () => {
    const result = formatCurrency(5000);
    expect(result).toContain("DA");
    expect(result).toBeTruthy();
  });

  it("formate zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("DA");
  });

  it("formate un grand montant", () => {
    const result = formatCurrency(1500000);
    expect(result).toContain("DA");
    expect(result.length).toBeGreaterThan(5);
  });

  it("formate un decimal (arrondi)", () => {
    const result = formatCurrency(1500.99);
    expect(result).toContain("DA");
  });
});

describe("formatDate", () => {
  it("formate une date au format fr", () => {
    const result = formatDate("2025-01-15");
    expect(result).toContain("15");
    expect(result).toContain("janvier");
    expect(result).toContain("2025");
  });

  it("contient 'Il y a' pour des dates recentes", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const dateStr = yesterday.toISOString().split("T")[0];
    const result = formatDate(dateStr);
    expect(result).toContain("Il y a");
  });
});

describe("formatShortDate", () => {
  it("retourne une date courte", () => {
    const result = formatShortDate("2025-03-01");
    expect(result).toContain("2025");
  });

  it("ne contient pas 'Il y a' ou 'Aujourd'hui'", () => {
    const result = formatShortDate("2025-01-15");
    expect(result).not.toContain("Aujourd'hui");
    expect(result).not.toContain("Hier");
    expect(result).not.toContain("Il y a");
  });
});
