import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import { getDatabase } from "../../database";
import { Alert } from "react-native";

const BACKUP_FILE_NAME = "garagecash_backup.json";

export async function exportBackup(): Promise<void> {
  try {
    const db = getDatabase();

    const transactions = await db.getAllAsync("SELECT * FROM transactions ORDER BY date DESC");
    const settings = await db.getAllAsync("SELECT * FROM settings");
    const categories = await db.getAllAsync("SELECT * FROM categories");
    const partners = await db.getAllAsync("SELECT * FROM partners");
    const clients = await db.getAllAsync("SELECT * FROM clients");
    const vehicules = await db.getAllAsync("SELECT * FROM vehicules");
    const ordres = await db.getAllAsync("SELECT * FROM ordres_reparation");
    const problemes = await db.getAllAsync("SELECT * FROM problemes");
    const interventions = await db.getAllAsync("SELECT * FROM interventions");
    const mouvementsMecaniciens = await db.getAllAsync("SELECT * FROM mouvements_mecaniciens");
    const mouvementsAssocies = await db.getAllAsync("SELECT * FROM comptes_associes");
    const objectif = await db.getAllAsync("SELECT * FROM objectif");
    const objectifAlimentations = await db.getAllAsync("SELECT * FROM objectif_alimentations");

    const backup = {
      version: 6,
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        settings,
        categories,
        partners,
        clients,
        vehicules,
        ordres,
        problemes,
        interventions,
        mouvementsMecaniciens,
        mouvementsAssocies,
        objectif,
        objectifAlimentations,
      },
    };

    const file = new File(Paths.cache, BACKUP_FILE_NAME);
    file.create({ overwrite: true });
    file.write(JSON.stringify(backup, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Sauvegarder la base de données",
    });
  } catch (error) {
    Alert.alert("Erreur", "Impossible d'exporter la sauvegarde.");
  }
}

export async function importBackup(): Promise<boolean> {
  try {
    const result = await getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const file = new File(fileUri);
    const content = await file.text();

    const backup = JSON.parse(content);

    if (!backup.version || !backup.data) {
      Alert.alert("Erreur", "Fichier de sauvegarde invalide.");
      return false;
    }

    const db = getDatabase();

    await db.runAsync("DELETE FROM mouvements_mecaniciens");
    await db.runAsync("DELETE FROM comptes_associes");
    await db.runAsync("DELETE FROM objectif_alimentations");
    await db.runAsync("DELETE FROM objectif");
    await db.runAsync("DELETE FROM problemes");
    await db.runAsync("DELETE FROM interventions");
    await db.runAsync("DELETE FROM transactions");
    await db.runAsync("DELETE FROM ordres_reparation");
    await db.runAsync("DELETE FROM vehicules");
    await db.runAsync("DELETE FROM clients");
    await db.runAsync("DELETE FROM partners");
    await db.runAsync("DELETE FROM categories");
    await db.runAsync("DELETE FROM settings");

    for (const cat of backup.data.categories || []) {
      await db.runAsync(
        "INSERT INTO categories (id, name, icon, color, type, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.is_default, cat.created_at, cat.updated_at]
      );
    }

    for (const setting of backup.data.settings || []) {
      await db.runAsync(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
        [setting.key, setting.value, setting.updated_at]
      );
    }

    for (const partner of backup.data.partners || []) {
      await db.runAsync(
        "INSERT INTO partners (id, name, commission_percent, created_at) VALUES (?, ?, ?, ?)",
        [partner.id, partner.name, partner.commission_percent ?? 0, partner.created_at]
      );
    }

    for (const client of backup.data.clients || []) {
      await db.runAsync(
        "INSERT INTO clients (id, nom, prenom, telephone, created_at) VALUES (?, ?, ?, ?, ?)",
        [client.id, client.nom, client.prenom, client.telephone, client.created_at]
      );
    }

    for (const vehicule of backup.data.vehicules || []) {
      await db.runAsync(
        "INSERT INTO vehicules (id, client_id, immatriculation, marque, modele, annee, telephone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [vehicule.id, vehicule.client_id, vehicule.immatriculation, vehicule.marque, vehicule.modele, vehicule.annee, vehicule.telephone, vehicule.created_at]
      );
    }

    for (const ordre of backup.data.ordres || []) {
      await db.runAsync(
        "INSERT INTO ordres_reparation (id, vehicule_id, mecanicien_id, realisateur, date_creation, kilometrage, probleme, intervention_reel, montant_total, statut, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [ordre.id, ordre.vehicule_id, ordre.mecanicien_id ?? null, ordre.realisateur ?? "proprio", ordre.date_creation, ordre.kilometrage, ordre.probleme, ordre.intervention_reel, ordre.montant_total, ordre.statut, ordre.created_at, ordre.updated_at]
      );
    }

    for (const tx of backup.data.transactions || []) {
      await db.runAsync(
        "INSERT INTO transactions (id, amount, type, category, description, photo_uri, date, partner_id, ordre_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [tx.id, tx.amount, tx.type, tx.category, tx.description, tx.photo_uri ?? null, tx.date, tx.partner_id ?? null, tx.ordre_id ?? null, tx.created_at, tx.updated_at]
      );
    }

    for (const p of backup.data.problemes || []) {
      await db.runAsync(
        "INSERT INTO problemes (id, ordre_id, description, created_at) VALUES (?, ?, ?, ?)",
        [p.id, p.ordre_id, p.description, p.created_at]
      );
    }

    for (const intv of backup.data.interventions || []) {
      await db.runAsync(
        "INSERT INTO interventions (id, ordre_id, description, created_at) VALUES (?, ?, ?, ?)",
        [intv.id, intv.ordre_id, intv.description, intv.created_at]
      );
    }

    for (const m of backup.data.mouvementsMecaniciens || []) {
      await db.runAsync(
        "INSERT INTO mouvements_mecaniciens (id, mecanicien_id, type, montant, date, description, ordre_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [m.id, m.mecanicien_id, m.type, m.montant, m.date, m.description, m.ordre_id ?? null, m.created_at]
      );
    }

    for (const m of backup.data.mouvementsAssocies || []) {
      await db.runAsync(
        "INSERT INTO comptes_associes (id, cible, type, montant, date, description, ordre_id, transaction_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [m.id, m.cible, m.type, m.montant, m.date, m.description, m.ordre_id ?? null, m.transaction_id ?? null, m.created_at]
      );
    }

    for (const obj of backup.data.objectif || []) {
      await db.runAsync(
        "INSERT INTO objectif (id, montant_cible, date_debut, description, created_at) VALUES (?, ?, ?, ?, ?)",
        [obj.id, obj.montant_cible, obj.date_debut, obj.description, obj.created_at]
      );
    }

    for (const a of backup.data.objectifAlimentations || []) {
      await db.runAsync(
        "INSERT INTO objectif_alimentations (id, montant, date, description, created_at) VALUES (?, ?, ?, ?, ?)",
        [a.id, a.montant, a.date, a.description, a.created_at]
      );
    }

    return true;
  } catch (error) {
    Alert.alert("Erreur", "Impossible d'importer la sauvegarde. Vérifiez le format du fichier.");
    return false;
  }
}
