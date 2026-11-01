import { transactionSchema } from "../../src/features/transactions/schema";

describe("transactionSchema", () => {
  const validExpense = {
    amount: 5000,
    type: "expense" as const,
    category: "Achat matériel" as const,
  };

  it("accepte une depense valide", () => {
    const result = transactionSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("accepte avec description", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      description: "Clé dynamométrique",
    });
    expect(result.success).toBe(true);
  });

  it("accepte description vide", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepte avec ordreId", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      type: "income",
      category: "Réparation",
      ordreId: "abc-123-def",
    });
    expect(result.success).toBe(true);
  });

  it("accepte ordreId null", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      ordreId: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepte sans ordreId", () => {
    const result = transactionSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("rejette montant zero", () => {
    const result = transactionSchema.safeParse({ ...validExpense, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positif");
    }
  });

  it("rejette montant negatif", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejette montant manquant", () => {
    const { amount, ...rest } = validExpense;
    const result = transactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("montant");
    }
  });

  it("rejette montant > 999999999", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      amount: 1000000000,
    });
    expect(result.success).toBe(false);
  });

  it("rejette categorie invalide", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      category: "Categorie inexistante",
    });
    expect(result.success).toBe(false);
  });

  it("accepte description = 200 caracteres (limite)", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      description: "A".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejette description > 200 caracteres", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      description: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepte categorie 'Réparation'", () => {
    const result = transactionSchema.safeParse({
      amount: 15000,
      type: "income",
      category: "Réparation",
    });
    expect(result.success).toBe(true);
  });

  it("accepte toutes les categories de depense", () => {
    const categories = [
      "Achat matériel",
      "Loyer",
      "Consommables",
      "Charges",
      "Épargne objectif",
      "Retrait associé",
      "Retrait mécanicien",
      "Investissement",
      "Autre",
    ];
    for (const cat of categories) {
      const result = transactionSchema.safeParse({
        amount: 100,
        type: "expense" as const,
        category: cat,
      });
      expect(result.success).toBe(true);
    }
  });
});
