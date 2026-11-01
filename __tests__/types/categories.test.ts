import { EXPENSE_CATEGORIES, CATEGORY_LABEL } from "../../src/features/transactions/types";

describe("EXPENSE_CATEGORIES", () => {
  it("contient les 10 categories (9 depenses + Réparation)", () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(10);
  });

  it("contient Achat materiel", () => {
    expect(EXPENSE_CATEGORIES).toContain("Achat matériel");
  });

  it("contient Loyer", () => {
    expect(EXPENSE_CATEGORIES).toContain("Loyer");
  });

  it("contient Consommables", () => {
    expect(EXPENSE_CATEGORIES).toContain("Consommables");
  });

  it("contient Charges", () => {
    expect(EXPENSE_CATEGORIES).toContain("Charges");
  });

  it("contient Épargne objectif", () => {
    expect(EXPENSE_CATEGORIES).toContain("Épargne objectif");
  });

  it("contient Retrait associé", () => {
    expect(EXPENSE_CATEGORIES).toContain("Retrait associé");
  });

  it("contient Retrait mécanicien", () => {
    expect(EXPENSE_CATEGORIES).toContain("Retrait mécanicien");
  });

  it("contient Investissement", () => {
    expect(EXPENSE_CATEGORIES).toContain("Investissement");
  });

  it("contient Autre", () => {
    expect(EXPENSE_CATEGORIES).toContain("Autre");
  });

  it("contient Réparation (pour les revenus O.R.)", () => {
    expect(EXPENSE_CATEGORIES).toContain("Réparation");
  });

  it("toutes les categories ont un label", () => {
    for (const cat of EXPENSE_CATEGORIES) {
      expect(CATEGORY_LABEL[cat]).toBeDefined();
    }
  });
});
