# PLAN v3 — Proprio + Associé 50/50 + Mécaniciens

> Remplace le modèle « Patron + Mécaniciens (commission) » par un modèle à
> **2 associés égaux (Proprio + Associé)** qui se partagent le **bénéfice net 50/50**,
> plus des **mécaniciens commissionnés** et un **objectif d'épargne commun**.

---

## 1. Vision / principe

| Acteur | Rôle |
|---|---|
| **Proprio** (toi) | 50 % du bénéfice net + **capital initial** (ton apport, non partagé) |
| **Associé** | 50 % du bénéfice net |
| **Mécaniciens** | commission en % sur chaque O.R. qu'ils effectuent |

- **Diag** : plus de part personnelle → le montant total est partagé 50/50.
- **Loyer / charges** : plus « à ta charge » → dépenses **communes** réparties 50/50.
- **Objectif épargne** : **commun**, chaque alimentation débitée 50/50 des 2 associés.
- **Partage temps réel** : chaque mouvement est immédiatement réparti.

---

## 2. Flux monétaire (temps réel)

```
Encaissement O.R. (montant M)
   ├── Commission mécanicien = M × %            → compte du mécanicien
   └── net = M − commission → +net/2 Proprio, +net/2 Associé

Dépense commune (loyer, charges, achats) (D)
   └── −D/2 Proprio, −D/2 Associé

Retrait associé (R)   → sort de la caisse, débité du compte de CET associé
Retrait mécanicien (R)→ sort de la caisse, débité du compte du mécanicien
Alimentation objectif (A) → dépense commune : −A/2 Proprio, −A/2 Associé
```

**Soldes**
```
solde Proprio  = capital initial + Σ parts_recettes − Σ parts_dépenses − retraits
solde Associé  = Σ parts_recettes − Σ parts_dépenses − retraits
solde Mécanicien = Σ commissions − retraits
bénéfice net (lecture) = solde Proprio + solde Associé (hors capital)
```

**Identité comptable** : `solde Proprio + solde Associé + solde Mécaniciens = solde caisse` ✓

---

## 3. Modèle de données (`src/database/index.ts`)

### Nouvelle table
| table | colonnes | rôle |
|---|---|---|
| `mouvements_associes` | `id, cible ('proprio'\|'associe'), type ('part_recette'\|'part_depense'\|'retrait'), montant (signé), date, description, ordre_id, created_at` | compte des 2 associés |

### Colonnes supprimées
- `ordres_reparation.montant_diag` (diag partagé 50/50, plus de part perso).

### Settings
- Ajout `associe_name` (nom du 2ᵉ associé, défaut « Associé »).

### Catégories
- Ajouter « Retrait associé » (expense).
- Conserver : Achat matériel, Loyer, Consommables, Charges, Épargne objectif, Retrait mécanicien, Investissement, Autre, Réparation (income).

---

## 4. Changements par fichier

### `src/utils/finance.ts`
- Ajouter `split50(montant)` → `{ part: montant / 2 }` (ou fonction `half`).
- Conserver `calculateCommission`, `calculateObjectifProgression`.

### `src/features/finance/`
| fichier | action |
|---|---|
| `types.ts` | types `MouvementAssocie` (cible, type, montant signé) ; labels |
| `api.ts` | `getMouvementsAssocies(cible?)` ; `getSoldeAssocie(cible)` ; `createRetraitAssocie` ; `crediterPartRecette(cible, montant, ordreId)` ; `debiterPartDepense(cible, montant)` ; `getAssocieName`/`setAssocieName` |
| `hooks.ts` | `useAssocies()` (les 2 comptes + totaux) ; adapter `useFinanceOverview` ; `useFinanceMutations` (retrait associé) |
| `schema.ts` | `retraitAssocieSchema` (cible, montant, date, description) |

### `src/features/ordres/`
- `types.ts`, `schema.ts` : **supprimer `montant_diag`**.
- `api.ts` : `updateOrdreMontant(id, montant_total)` (sans diag) ; retirer `montant_diag` des SELECT.
- `hooks.ts` : commission **au prorata de chaque paiement** (`commission = paiement × %`) au lieu de « au paiement complet ».

### `src/features/transactions/`
- `createTransaction` : après écriture de la transaction, **répartir automatiquement** :
  - income (Réparation/O.R.) → `+net/2` sur chaque associé (net = montant − commission du mécanicien, calculé au moment du paiement) ;
  - expense **commune** → `−D/2` sur chaque associé ;
  - expense « Retrait associé » → débité au compte ciblé (via l'API finance, pas ici).
- Ajouter un flag/sélecteur pour distinguer dépense commune vs retrait.

### `src/features/export/`
- `backup.ts` : retirer `montant_diag`, ajouter `mouvements_associes`.

### `src/database/index.ts`
- Créer `mouvements_associes` + index ; supprimer `montant_diag` (migration) ; seed `associe_name` ; ajouter la catégorie « Retrait associé ».

---

## 5. Écrans

| écran | action |
|---|---|
| `app/(tabs)/tresorerie.tsx` | **Associés** : cartes Proprio (solde + capital) et Associé (solde) avec boutons « Retrait » + « Historique » ; garder ObjectifCard + Mécaniciens |
| `app/(tabs)/settings.tsx` | configurer le **nom de l'associé** (+ gestion mécaniciens inchangée) |
| `app/objectif.tsx` | inchangé (objectif commun), mentionner répartition 50/50 |
| `app/detail-ordre.tsx` | retirer le champ **montant_diag** du modal « Fixer le montant » et l'affichage Diag/Réparation |
| `app/create-ordre.tsx` | inchangé (choix mécanicien) |
| `app/retrait-mecanicien.tsx` | inchangé |
| **nouveau** `app/retrait-associe.tsx` | retrait pour Proprio ou Associé (choix de la cible) |
| **nouveau** `app/associe-detail.tsx` | historique + solde d'un associé (Proprio ou Associé) |
| `app/_layout.tsx` | ajouter `retrait-associe`, `associe-detail` |

---

## 6. Migrations (données existantes)

1. `ALTER TABLE ordres_reparation` : marquer `montant_diag` obsolète (ou `DROP COLUMN`).
2. Créer `mouvements_associes` + `idx_mouvements_associes_cible`.
3. Seed `settings.associe_name = 'Associé'`.
4. Ajouter catégorie « Retrait associé ».
5. Backfill optionnel : rejouer les encaissements passés pour créditer 50/50 (sinon les comptes partent de 0).

---

## 7. Tests

- `calculateCommission` (déjà en place).
- `split50` / répartition 50/50 (arrondis).
- Solde associé = capital + parts − dépenses − retraits.
- Schéma `retraitAssocie` (cible valide, montant positif).
- Mettre à jour `ordreMontantSchema` (suppression diag) et les tests concernés.

---

## 8. Ordre d'implémentation

1. BDD : `mouvements_associes` + suppression `montant_diag` + catégorie + settings.
2. `types.ts` + `utils/finance.ts` (split 50).
3. `finance/api.ts` + `hooks.ts` (associés).
4. `ordres/` (retrait diag, commission au prorata) + répartition auto dans `transactions/`.
5. Écrans (Trésorerie, retrait-associé, associe-detail, settings).
6. Backup + tests.

---

## 9. Décisions validées

1. Structure : Proprio + 1 associé 50/50 + mécaniciens commissionnés.
2. Partage : bénéfice net (encaissements − dépenses communes), 50/50.
3. Diag : inclus dans le pot commun (partagé 50/50).
4. Objectif épargne : commun, alimenté 50/50.
5. Capital initial : apport du proprio (non partagé).
6. Répartition : temps réel à chaque mouvement.
