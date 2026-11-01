# Recette fonctionnelle — Ordres de Réparation

## Module 1 : Création Client + Véhicule + O.R.

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 1.1 | Créer client via recherche | Onglet Ordres > FAB "+" > taper nom inexistant > "Nouveau client" > remplir nom, prénom, tel > "Créer le client" | Client créé, passe à l'étape véhicule | ☐ |
| 1.2 | Créer client existant (recherche) | Onglet Ordres > FAB "+" > taper nom existant > sélectionner dans la liste | Passe directement aux véhicules du client | ☐ |
| 1.3 | Créer véhicule pour client existant | Après sélection client > "Nouveau véhicule" > immat, marque, modèle, année | Véhicule créé, pré-remplit l'O.R. | ☐ |
| 1.4 | Véhicule existant (1 seul) | Sélectionner client avec 1 véhicule | Sélection automatique, passe au kilométrage | ☐ |
| 1.5 | Véhicule existant (plusieurs) | Sélectionner client avec N véhicules | Affiche la liste, l'utilisateur choisit | ☐ |
| 1.6 | Création O.R. complète | Saisir kilométrage > "Créer l'O.R." | O.R. brouillon visible dans la liste | ☐ |
| 1.7 | Immatriculation déjà existante | Créer véhicule avec immat. déjà en base | Alerte "Ce véhicule existe déjà" > proposition de l'utiliser | ☐ |
| 1.8 | Validation formulaire client | Créer client sans nom | Erreur "Le nom est requis" | ☐ |
| 1.9 | Validation formulaire client | Créer client sans téléphone | Erreur "Le téléphone est requis" | ☐ |
| 1.10 | Validation formulaire véhicule | Créer véhicule sans immatriculation | Erreur "L'immatriculation est requise" | ☐ |

## Module 2 : Cycle de vie O.R. (statuts)

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 2.1 | Brouillon → En cours | O.R. brouillon > "Saisir le diagnostic" > remplir > Enregistrer | Statut = "En cours", problème enregistré | ☐ |
| 2.2 | En cours → Terminé | O.R. en cours > "Saisir l'intervention" > remplir > Enregistrer | Statut = "Terminé", intervention enregistrée | ☐ |
| 2.3 | Terminé → Facturé | O.R. terminé > "Fixer le montant" > saisir montant > Valider | Statut = "Facturé", montant_total enregistré | ☐ |
| 2.4 | Facturé → Payé (1 paiement) | O.R. facturé > "Enregistrer un paiement" > bouton Total > Payer | Statut = "Payé", total_paye = montant_total | ☐ |
| 2.5 | Facturé → Payé (2 paiements) | O.R. facturé (1000 DA) > Paiement 500 DA > Paiement 500 DA | Après 2e : statut = "Payé", total_paye = 1000 | ☐ |
| 2.6 | Paiement > reste | O.R. facturé (1000 DA) > tenter paiement 1200 DA | Erreur "montant ne peut pas dépasser le reste" | ☐ |
| 2.7 | État initial : brouillon | Créer O.R. sans diagnostic | Statut = "Brouillon", problème/intervention non renseigné | ☐ |
| 2.8 | Bouton "Passer à..." | Vérifier que le bouton change selon le statut | Brouillon→"En cours", En cours→"Terminé", Terminé→"Facturé", Facturé→pas affiché | ☐ |

## Module 3 : Trésorerie & Paiements

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 3.1 | Transaction liée à l'O.R. | Payer 500 DA sur O.R. > Aller dans Historique | Transaction "Réparation" 500 DA visible, catégorie "Réparation" | ☐ |
| 3.2 | Solde mis à jour après paiement | Capital 500000, 0 dépense, payer 1000 DA | Solde = 501000 (500000 + 1000) | ☐ |
| 3.3 | C.A. Réparations dans stats | Créer 2 O.R. facturés (1000 + 2000 DA) | Accueil : "C.A. Réparations" = 3000 DA | ☐ |
| 3.4 | C.A. Encaissé dans stats | O.R.1 payé 1000, O.R.2 facturé non payé 2000 | Stats : "C.A. Réparations" = 3000, "O.R. encaissé" = 1000 | ☐ |
| 3.5 | O.R. payé ne peut plus être modifié | O.R. payé > revenir au détail | Pas de bouton "Passer à...", pas de bouton paiement | ☐ |
| 3.6 | Paiement partiel visible | Payer 300/1000 > voir détail O.R. | Payé 300, Reste 700, Total 1000 | ☐ |

## Module 4 : Historique & Filtres

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 4.1 | Filtre type "Réparations" | Historique > Filtres > Réparations | Affiche seulement les transactions de type income | ☐ |
| 4.2 | Filtre catégorie "Réparation" | Historique > Filtres > Catégorie Réparation | Affiche les transactions avec catégorie "Réparation" | ☐ |
| 4.3 | Transaction liée O.R. | Voir détail d'une transaction issue O.R. | Affiche "Ordre de réparation #XXXXXX" | ☐ |

## Module 5 : Filtrage des O.R.

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 5.1 | Filtre par statut | Onglet Ordres > filtre "En cours" | Affiche seulement les O.R. en cours | ☐ |
| 5.2 | Filtre "Tous" | Onglet Ordres > filtre "Tous" | Affiche tous les O.R. | ☐ |
| 5.3 | Filtre "Payé" | Onglet Ordres > filtre "Payé" | Affiche seulement les O.R. payés | ☐ |

## Module 6 : Suppression

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 6.1 | Supprimer O.R. brouillon | O.R. brouillon > corbeille > Confirmer | O.R. supprimé, plus dans la liste | ☐ |
| 6.2 | Supprimer transaction liée O.R. | Historique > transaction Réparation > Supprimer | Transaction supprimée, total_paye de l'O.R. diminue | ☐ |

## Module 7 : Export & Backup

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 7.1 | Export CSV avec données O.R. | Paramètres > Export CSV | CSV contient colonne O.R. et résumé C.A. Réparations | ☐ |
| 7.2 | Backup inclut nouvelles tables | Paramètres > Sauvegarde | JSON contient clients, vehicules, ordres_reparation | ☐ |
| 7.3 | Restauration backup | Paramètres > Restaurer > sélection fichier | Données clients, véhicules, O.R. restaurées | ☐ |

## Module 8 : Navigation

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 8.1 | Onglet Ordres présent | Barre de navigation | 5 onglets : Accueil, Ordres, Historique, Stats, Paramètres | ☐ |
| 8.2 | FAB double sur Accueil | Accueil | 2 FAB : "+" (dépense) et "clé" (nouvel O.R.) | ☐ |
| 8.3 | Derniers O.R. sur Accueil | Accueil | Section "Derniers O.R." après les stats, avant les dépenses | ☐ |
| 8.4 | "Nouvelle dépense" (pas opération) | Accueil > FAB "+" | Titre de l'écran : "Nouvelle dépense" | ☐ |

## Module 9 : Régressions

| # | Scénario | Étapes | Résultat attendu | OK |
|---|---------|--------|------------------|----|
| 9.1 | Créer dépense | FAB "+" > saisir montant, catégorie, description > Enregistrer | Dépense visible dans historique, solde diminué | ☐ |
| 9.2 | Modifier dépense | Historique > détail > Modifier > changer montant > Mettre à jour | Dépense modifiée | ☐ |
| 9.3 | Supprimer dépense | Historique > détail > Supprimer | Dépense supprimée | ☐ |
| 9.4 | Stats dépenses par catégorie | Onglet Stats | Répartition par catégorie (dépenses uniquement) | ☐ |
| 9.5 | Capital initial | Paramètres > changer capital > Enregistrer | Capital mis à jour, solde recalculé | ☐ |
| 9.6 | Thème clair/sombre | Changer thème système | L'app s'adapte | ☐ |
