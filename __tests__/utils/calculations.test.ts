import { calculateBalance } from "../../src/utils/calculations";

describe("calculateBalance", () => {
  it("aucun mouvement → 0", () => {
    const balance = calculateBalance({
      totalExpenses: 0,
      totalIncomes: 0,
      movementCount: 0,
      categoryBreakdown: [],
    });
    expect(balance).toBe(0);
  });

  it("dépenses uniquement → négatif", () => {
    const balance = calculateBalance({
      totalExpenses: 100000,
      totalIncomes: 0,
      movementCount: 5,
      categoryBreakdown: [],
    });
    expect(balance).toBe(-100000);
  });

  it("recettes - dépenses", () => {
    const balance = calculateBalance({
      totalExpenses: 200000,
      totalIncomes: 50000,
      movementCount: 10,
      categoryBreakdown: [],
    });
    expect(balance).toBe(-150000);
  });

  it("recettes uniquement → positif", () => {
    const balance = calculateBalance({
      totalExpenses: 0,
      totalIncomes: 300000,
      movementCount: 3,
      categoryBreakdown: [],
    });
    expect(balance).toBe(300000);
  });

  it("équilibre (recettes = dépenses) → 0", () => {
    const balance = calculateBalance({
      totalExpenses: 600000,
      totalIncomes: 600000,
      movementCount: 2,
      categoryBreakdown: [],
    });
    expect(balance).toBe(0);
  });
});
