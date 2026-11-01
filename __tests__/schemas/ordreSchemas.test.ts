import {
  ordreCreationSchema,
  ordreMontantSchema,
  paiementSchema,
} from "../../src/features/ordres/schema";

describe("ordreCreationSchema", () => {
  it("accepte creation valide avec kilometrage", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
      kilometrage: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("accepte creation sans kilometrage", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
      kilometrage: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepte creation kilometrage undefined", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejette vehicule_id manquant", () => {
    const result = ordreCreationSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Véhicule");
    }
  });

  it("rejette kilometrage negatif", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
      kilometrage: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positif");
    }
  });

  it("rejette kilometrage zero", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
      kilometrage: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positif");
    }
  });

  it("rejette kilometrage non entier", () => {
    const result = ordreCreationSchema.safeParse({
      vehicule_id: 1,
      kilometrage: 500.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("ordreMontantSchema", () => {
  it("accepte montant valide", () => {
    const result = ordreMontantSchema.safeParse({ montant_total: 15000 });
    expect(result.success).toBe(true);
  });

  it("rejette montant zero", () => {
    const result = ordreMontantSchema.safeParse({ montant_total: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positif");
    }
  });

  it("rejette montant negatif", () => {
    const result = ordreMontantSchema.safeParse({ montant_total: -5000 });
    expect(result.success).toBe(false);
  });

  it("rejette montant > 999999999", () => {
    const result = ordreMontantSchema.safeParse({
      montant_total: 1000000000,
    });
    expect(result.success).toBe(false);
  });

  it("accepte montant = 999999999 (limite)", () => {
    const result = ordreMontantSchema.safeParse({
      montant_total: 999999999,
    });
    expect(result.success).toBe(true);
  });

  it("rejette montant manquant", () => {
    const result = ordreMontantSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("montant");
    }
  });
});

describe("paiementSchema", () => {
  it("accepte montant valide", () => {
    const result = paiementSchema.safeParse({ montant: 5000 });
    expect(result.success).toBe(true);
  });

  it("rejette montant zero", () => {
    const result = paiementSchema.safeParse({ montant: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positif");
    }
  });

  it("rejette montant negatif", () => {
    const result = paiementSchema.safeParse({ montant: -500 });
    expect(result.success).toBe(false);
  });

  it("rejette montant manquant", () => {
    const result = paiementSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("montant");
    }
  });
});
