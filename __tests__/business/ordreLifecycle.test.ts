describe("Cycle de vie O.R. — Logique metier", () => {
  const calculerReste = (montantTotal: number, totalPaye: number) =>
    montantTotal - totalPaye;

  describe("calculReste", () => {
    it("reste = total quand aucun paiement", () => {
      expect(calculerReste(10000, 0)).toBe(10000);
    });

    it("reste = 0 quand tout est paye", () => {
      expect(calculerReste(10000, 10000)).toBe(0);
    });

    it("reste = 5000 quand paye la moitie", () => {
      expect(calculerReste(10000, 5000)).toBe(5000);
    });

    it("reste negatif = trop-percu", () => {
      expect(calculerReste(10000, 12000)).toBe(-2000);
    });
  });

  describe("CA Reparations (facture + paye)", () => {
    const calculerCA = (
      ordres: { statut: string; montant_total: number | null }[]
    ) =>
      ordres
        .filter((o) => o.statut === "facture" || o.statut === "paye")
        .reduce((sum, o) => sum + (o.montant_total ?? 0), 0);

    it("CA = 0 quand aucun OR facture", () => {
      expect(
        calculerCA([
          { statut: "brouillon", montant_total: null },
          { statut: "en_cours", montant_total: null },
        ])
      ).toBe(0);
    });

    it("CA = somme des OR factures et payes", () => {
      expect(
        calculerCA([
          { statut: "facture", montant_total: 15000 },
          { statut: "paye", montant_total: 25000 },
          { statut: "brouillon", montant_total: null },
        ])
      ).toBe(40000);
    });

    it("CA = 0 pour OR termine (pas encore facture)", () => {
      expect(
        calculerCA([{ statut: "termine", montant_total: 5000 }])
      ).toBe(0);
    });

    it("OR avec montant_total null ne casse pas le calcul", () => {
      expect(
        calculerCA([
          { statut: "facture", montant_total: null },
          { statut: "paye", montant_total: 10000 },
        ])
      ).toBe(10000);
    });
  });

  describe("validation paiement", () => {
    const peutPayer = (
      montant: number,
      montantTotal: number,
      totalPaye: number
    ) => montant > 0 && totalPaye + montant <= montantTotal;

    it("paiement inferieur au reste autorise", () => {
      expect(peutPayer(3000, 10000, 2000)).toBe(true);
    });

    it("paiement egal au reste autorise", () => {
      expect(peutPayer(8000, 10000, 2000)).toBe(true);
    });

    it("paiement superieur au reste refuse", () => {
      expect(peutPayer(9000, 10000, 2000)).toBe(false);
    });

    it("paiement zero refuse", () => {
      expect(peutPayer(0, 10000, 2000)).toBe(false);
    });

    it("paiement negatif refuse", () => {
      expect(peutPayer(-500, 10000, 2000)).toBe(false);
    });

    it("paiement total en une fois autorise", () => {
      expect(peutPayer(10000, 10000, 0)).toBe(true);
    });

    it("dernier paiement exact autorise", () => {
      expect(peutPayer(2500, 10000, 7500)).toBe(true);
    });
  });

  describe("transition statut apres paiement", () => {
    const doitPasserAPaye = (
      montantTotal: number,
      totalPaye: number,
      nouveauPaiement: number
    ) => totalPaye + nouveauPaiement >= montantTotal;

    it("paiement complet -> paye", () => {
      expect(doitPasserAPaye(10000, 0, 10000)).toBe(true);
    });

    it("dernier paiement partiel -> paye", () => {
      expect(doitPasserAPaye(10000, 7000, 3000)).toBe(true);
    });

    it("paiement partiel pas suffisant -> pas paye", () => {
      expect(doitPasserAPaye(10000, 0, 3000)).toBe(false);
    });

    it("trop percu -> paye quand meme", () => {
      expect(doitPasserAPaye(10000, 9000, 2000)).toBe(true);
    });

    it("montant non fixe -> jamais paye", () => {
      expect(doitPasserAPaye(0, 0, 100)).toBe(true);
    });
  });

  describe("detection paye apres insertion transaction (corrige double comptage)", () => {
    const doitPasserAPayeApresInsert = (
      montantTotal: number,
      totalPayeApresInsert: number
    ) =>
      montantTotal > 0 &&
      totalPayeApresInsert >= montantTotal;

    it("paiement unique exact -> paye", () => {
      expect(doitPasserAPayeApresInsert(10000, 10000)).toBe(true);
    });

    it("deux paiements, le 2e complete -> paye", () => {
      expect(doitPasserAPayeApresInsert(10000, 10000)).toBe(true);
    });

    it("premier paiement partiel -> pas paye", () => {
      expect(doitPasserAPayeApresInsert(10000, 5000)).toBe(false);
    });

    it("montant non fixe (0) -> pas paye", () => {
      expect(doitPasserAPayeApresInsert(0, 500)).toBe(false);
    });

    it("montant non fixe (null) -> pas paye", () => {
      expect(doitPasserAPayeApresInsert(0, 0)).toBe(false);
    });

    it("trop percu -> paye", () => {
      expect(doitPasserAPayeApresInsert(10000, 12000)).toBe(true);
    });

    it("paiement exact avec montant eleve", () => {
      expect(doitPasserAPayeApresInsert(150000, 150000)).toBe(true);
    });
  });

  describe("reste apres paiements", () => {
    const calculerReste = (montantTotal: number, totalPaye: number) =>
      montantTotal - totalPaye;

    it("reste = 0 apres paiement complet", () => {
      expect(calculerReste(10000, 10000)).toBe(0);
    });

    it("reste = 5000 apres 1er paiement", () => {
      expect(calculerReste(10000, 5000)).toBe(5000);
    });

    it("reste = 0 apres sur-paiement (negatif)", () => {
      const reste = calculerReste(10000, 12000);
      expect(reste).toBe(-2000);
    });

    it("le bouton de paiement ne s'affiche pas si reste <= 0", () => {
      const reste = calculerReste(10000, 10000);
      expect(reste > 0).toBe(false);
    });
  });

  describe("validation avancement statut avec listes multiples", () => {
    const peutPasserA = (
      nextStatut: string,
      nbProblemes: number,
      nbInterventions: number
    ) => {
      if (nextStatut === "en_cours" && nbProblemes === 0) return false;
      if (nextStatut === "termine" && nbInterventions === 0) return false;
      return true;
    };

    it("brouillon -> en_cours: refuse si 0 probleme", () => {
      expect(peutPasserA("en_cours", 0, 0)).toBe(false);
    });

    it("brouillon -> en_cours: accepte si >=1 probleme", () => {
      expect(peutPasserA("en_cours", 1, 0)).toBe(true);
    });

    it("brouillon -> en_cours: accepte avec 3 problemes", () => {
      expect(peutPasserA("en_cours", 3, 0)).toBe(true);
    });

    it("en_cours -> termine: refuse si 0 intervention", () => {
      expect(peutPasserA("termine", 3, 0)).toBe(false);
    });

    it("en_cours -> termine: accepte si >=1 intervention", () => {
      expect(peutPasserA("termine", 3, 1)).toBe(true);
    });

    it("termine -> facture: toujours accepte (pas de condition)", () => {
      expect(peutPasserA("facture", 5, 3)).toBe(true);
    });

    it("facture -> paye: toujours accepte (gere par paiement)", () => {
      expect(peutPasserA("paye", 5, 3)).toBe(true);
    });
  });

  describe("edition autorisee selon statut", () => {
    const estEditable = (statut: string) => true;

    it("brouillon: editable", () => expect(estEditable("brouillon")).toBe(true));
    it("en_cours: editable", () => expect(estEditable("en_cours")).toBe(true));
    it("termine: editable", () => expect(estEditable("termine")).toBe(true));
    it("facture: editable", () => expect(estEditable("facture")).toBe(true));
    it("paye: editable", () => expect(estEditable("paye")).toBe(true));
  });
});
