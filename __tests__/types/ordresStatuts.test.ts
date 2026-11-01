import {
  ORDRE_STATUTS,
  STATUT_LABEL,
  STATUT_TRANSITIONS,
} from "../../src/features/ordres/types";

describe("ORDRE_STATUTS", () => {
  it("contient les 5 statuts dans l'ordre", () => {
    expect(ORDRE_STATUTS).toEqual([
      "brouillon",
      "en_cours",
      "termine",
      "facture",
      "paye",
    ]);
  });

  it("tous les statuts ont un label", () => {
    for (const statut of ORDRE_STATUTS) {
      expect(STATUT_LABEL[statut]).toBeDefined();
      expect(typeof STATUT_LABEL[statut]).toBe("string");
      expect(STATUT_LABEL[statut].length).toBeGreaterThan(0);
    }
  });
});

describe("STATUT_LABEL", () => {
  it("brouillon -> Brouillon", () => {
    expect(STATUT_LABEL["brouillon"]).toBe("Brouillon");
  });
  it("en_cours -> En cours", () => {
    expect(STATUT_LABEL["en_cours"]).toBe("En cours");
  });
  it("termine -> Terminé", () => {
    expect(STATUT_LABEL["termine"]).toBe("Terminé");
  });
  it("facture -> Facturé", () => {
    expect(STATUT_LABEL["facture"]).toBe("Facturé");
  });
  it("paye -> Payé", () => {
    expect(STATUT_LABEL["paye"]).toBe("Payé");
  });
});

describe("STATUT_TRANSITIONS", () => {
  it("brouillon ne peut aller que vers en_cours", () => {
    expect(STATUT_TRANSITIONS["brouillon"]).toEqual(["en_cours"]);
  });

  it("en_cours ne peut aller que vers termine", () => {
    expect(STATUT_TRANSITIONS["en_cours"]).toEqual(["termine"]);
  });

  it("termine ne peut aller que vers facture", () => {
    expect(STATUT_TRANSITIONS["termine"]).toEqual(["facture"]);
  });

  it("facture ne peut aller que vers paye", () => {
    expect(STATUT_TRANSITIONS["facture"]).toEqual(["paye"]);
  });

  it("paye n'a aucune transition (terminal)", () => {
    expect(STATUT_TRANSITIONS["paye"]).toEqual([]);
  });

  it("tous les statuts ont des transitions definies", () => {
    for (const statut of ORDRE_STATUTS) {
      expect(STATUT_TRANSITIONS[statut]).toBeDefined();
      expect(Array.isArray(STATUT_TRANSITIONS[statut])).toBe(true);
    }
  });

  it("les transitions sont toujours parmi les statuts valides", () => {
    for (const [, transitions] of Object.entries(STATUT_TRANSITIONS)) {
      for (const target of transitions) {
        expect(ORDRE_STATUTS).toContain(target);
      }
    }
  });

  it("aucun statut ne peut revenir en arriere", () => {
    const statutIndex = new Map(ORDRE_STATUTS.map((s, i) => [s, i]));
    for (const [from, transitions] of Object.entries(STATUT_TRANSITIONS)) {
      const fromIdx = statutIndex.get(from)!;
      for (const to of transitions) {
        const toIdx = statutIndex.get(to)!;
        expect(toIdx).toBeGreaterThan(fromIdx);
      }
    }
  });
});

describe("STATUT_TRANSITIONS - cas metier", () => {
  it("impossible de passer de brouillon a paye directement", () => {
    expect(STATUT_TRANSITIONS["brouillon"]).not.toContain("paye");
  });

  it("impossible de passer de brouillon a facture directement", () => {
    expect(STATUT_TRANSITIONS["brouillon"]).not.toContain("facture");
  });

  it("impossible de passer de en_cours a paye directement (sans montant)", () => {
    expect(STATUT_TRANSITIONS["en_cours"]).not.toContain("paye");
  });

  it("impossible de passer de termine a paye directement (sans fixer montant)", () => {
    expect(STATUT_TRANSITIONS["termine"]).not.toContain("paye");
  });

  it("chemin complet: brouillon -> en_cours -> termine -> facture -> paye", () => {
    const chemin = ["brouillon", "en_cours", "termine", "facture", "paye"];
    for (let i = 0; i < chemin.length - 1; i++) {
      const from = chemin[i];
      const to = chemin[i + 1];
      expect(STATUT_TRANSITIONS[from]).toContain(to);
    }
  });
});
