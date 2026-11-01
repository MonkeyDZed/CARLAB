import { vehiculeSchema } from "../../src/features/vehicules/schema";

describe("vehiculeSchema", () => {
  const base = {
    immatriculation: "AB-123-CD",
    marque: "Renault",
    modele: "Clio",
    telephone: "0550123456",
  };

  it("accepte un vehicule valide", () => {
    const result = vehiculeSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepte avec annee", () => {
    const result = vehiculeSchema.safeParse({ ...base, annee: 2020 });
    expect(result.success).toBe(true);
  });

  it("accepte annee null", () => {
    const result = vehiculeSchema.safeParse({ ...base, annee: null });
    expect(result.success).toBe(true);
  });

  it("accepte sans marque (optionnel)", () => {
    const result = vehiculeSchema.safeParse({ immatriculation: "AB-123-CD" });
    expect(result.success).toBe(true);
  });

  it("accepte marque vide (optionnel)", () => {
    const result = vehiculeSchema.safeParse({ immatriculation: "AB-123-CD", marque: "" });
    expect(result.success).toBe(true);
  });

  it("accepte modele vide (optionnel)", () => {
    const result = vehiculeSchema.safeParse({ immatriculation: "AB-123-CD", modele: "" });
    expect(result.success).toBe(true);
  });

  it("accepte telephone vide (optionnel)", () => {
    const result = vehiculeSchema.safeParse({ immatriculation: "AB-123-CD", telephone: "" });
    expect(result.success).toBe(true);
  });

  it("rejette immatriculation vide", () => {
    const result = vehiculeSchema.safeParse({ ...base, immatriculation: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("immatriculation");
    }
  });

  it("rejette objet vide", () => {
    const result = vehiculeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette marque trop longue", () => {
    const result = vehiculeSchema.safeParse({ ...base, marque: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejette annee avant 1950", () => {
    const result = vehiculeSchema.safeParse({ ...base, annee: 1949 });
    expect(result.success).toBe(false);
  });

  it("rejette annee apres 2100", () => {
    const result = vehiculeSchema.safeParse({ ...base, annee: 2101 });
    expect(result.success).toBe(false);
  });
});
