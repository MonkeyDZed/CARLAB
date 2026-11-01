import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("garagecash.db");
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      commission_percent REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      category TEXT NOT NULL,
      description TEXT,
      photo_uri TEXT,
      date TEXT NOT NULL,
      partner_id INTEGER REFERENCES partners(id),
      ordre_id TEXT REFERENCES ordres_reparation(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT,
      telephone TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      immatriculation TEXT NOT NULL UNIQUE,
      marque TEXT NOT NULL,
      modele TEXT NOT NULL,
      annee INTEGER,
      telephone TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ordres_reparation (
      id TEXT PRIMARY KEY,
      vehicule_id INTEGER NOT NULL REFERENCES vehicules(id),
      mecanicien_id INTEGER REFERENCES partners(id),
      realisateur TEXT NOT NULL DEFAULT 'proprio'
        CHECK(realisateur IN ('proprio','associe','mecanicien')),
      date_creation TEXT NOT NULL,
      kilometrage INTEGER,
      probleme TEXT,
      intervention_reel TEXT,
      montant_total REAL,
      statut TEXT NOT NULL DEFAULT 'brouillon'
        CHECK(statut IN ('brouillon','en_cours','termine','facture','paye')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS problemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordre_id TEXT NOT NULL REFERENCES ordres_reparation(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordre_id TEXT NOT NULL REFERENCES ordres_reparation(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mouvements_mecaniciens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mecanicien_id INTEGER NOT NULL REFERENCES partners(id),
      type TEXT NOT NULL CHECK(type IN ('commission','retrait')),
      montant REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      ordre_id TEXT REFERENCES ordres_reparation(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comptes_associes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cible TEXT NOT NULL CHECK(cible IN ('proprio','associe')),
      type TEXT NOT NULL CHECK(type IN ('part_recette','part_depense','retrait')),
      montant REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      ordre_id TEXT REFERENCES ordres_reparation(id),
      transaction_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS objectif (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      montant_cible REAL NOT NULL,
      date_debut TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS objectif_alimentations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      montant REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrations — colonnes ajoutées au fil des versions
  try {
    await database.execAsync(
      "ALTER TABLE transactions ADD COLUMN photo_uri TEXT"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE transactions ADD COLUMN ordre_id TEXT REFERENCES ordres_reparation(id)"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE vehicules ADD COLUMN telephone TEXT NOT NULL DEFAULT ''"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE partners ADD COLUMN commission_percent REAL NOT NULL DEFAULT 0"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE ordres_reparation ADD COLUMN mecanicien_id INTEGER REFERENCES partners(id)"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE ordres_reparation ADD COLUMN realisateur TEXT NOT NULL DEFAULT 'proprio'"
    );
  } catch (_) {}

  try {
    await database.execAsync(
      "ALTER TABLE ordres_reparation DROP COLUMN montant_diag"
    );
  } catch (_) {}

  // Index — créés après les migrations pour que les colonnes existent
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_ordre ON transactions(ordre_id);
    CREATE INDEX IF NOT EXISTS idx_ordres_vehicule ON ordres_reparation(vehicule_id);
    CREATE INDEX IF NOT EXISTS idx_ordres_statut ON ordres_reparation(statut);
    CREATE INDEX IF NOT EXISTS idx_ordres_mecanicien ON ordres_reparation(mecanicien_id);
    CREATE INDEX IF NOT EXISTS idx_vehicules_client ON vehicules(client_id);
    CREATE INDEX IF NOT EXISTS idx_problemes_ordre ON problemes(ordre_id);
    CREATE INDEX IF NOT EXISTS idx_interventions_ordre ON interventions(ordre_id);
    CREATE INDEX IF NOT EXISTS idx_mouvements_mecanicien ON mouvements_mecaniciens(mecanicien_id);
    CREATE INDEX IF NOT EXISTS idx_comptes_associes_cible ON comptes_associes(cible);
    CREATE INDEX IF NOT EXISTS idx_alimentations_date ON objectif_alimentations(date);
  `);

  try {
    const needMigration = await database.getFirstAsync<{ done: string }>(
      "SELECT value FROM settings WHERE key = 'migrated_telephone'"
    );
    if (!needMigration) {
      await database.execAsync(
        "UPDATE vehicules SET telephone = COALESCE((SELECT c.telephone FROM clients c WHERE c.id = vehicules.client_id), '') WHERE telephone = ''"
      );
      await database.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('migrated_telephone', '1')"
      );
    }
  } catch (_) {}

  // Migration : copie du texte probleme/intervention vers les tables dédiées
  try {
    const problemesCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM problemes"
    );
    if (problemesCount && problemesCount.count === 0) {
      const ordresWithProbleme = await database.getAllAsync<{ id: string; probleme: string }>(
        "SELECT id, probleme FROM ordres_reparation WHERE probleme IS NOT NULL AND probleme != ''"
      );
      for (const row of ordresWithProbleme) {
        await database.runAsync(
          "INSERT INTO problemes (ordre_id, description) VALUES (?, ?)",
          [row.id, row.probleme]
        );
      }
    }
  } catch (_) {}

  try {
    const interventionsCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM interventions"
    );
    if (interventionsCount && interventionsCount.count === 0) {
      const ordresWithIntervention = await database.getAllAsync<{ id: string; intervention_reel: string }>(
        "SELECT id, intervention_reel FROM ordres_reparation WHERE intervention_reel IS NOT NULL AND intervention_reel != ''"
      );
      for (const row of ordresWithIntervention) {
        await database.runAsync(
          "INSERT INTO interventions (ordre_id, description) VALUES (?, ?)",
          [row.id, row.intervention_reel]
        );
      }
    }
  } catch (_) {}

  const existingCategories = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories"
  );

  if (existingCategories && existingCategories.count === 0) {
    const categories = [
      { name: "Achat matériel", type: "expense", color: "#F44336", icon: "hammer-wrench", is_default: 1 },
      { name: "Loyer", type: "expense", color: "#FF9800", icon: "home", is_default: 1 },
      { name: "Consommables", type: "expense", color: "#2196F3", icon: "oil", is_default: 1 },
      { name: "Charges", type: "expense", color: "#E91E63", icon: "receipt", is_default: 1 },
      { name: "Épargne objectif", type: "expense", color: "#00897B", icon: "piggy-bank", is_default: 1 },
      { name: "Retrait associé", type: "expense", color: "#7E57C2", icon: "account-cash", is_default: 1 },
      { name: "Retrait mécanicien", type: "expense", color: "#9C27B0", icon: "account-cash", is_default: 1 },
      { name: "Investissement", type: "expense", color: "#4CAF50", icon: "chart-line", is_default: 1 },
      { name: "Autre", type: "expense", color: "#607D8B", icon: "dots-horizontal", is_default: 1 },
      { name: "Réparation", type: "income", color: "#2E7D32", icon: "wrench", is_default: 1 },
    ];

    for (const cat of categories) {
      await database.runAsync(
        "INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, ?)",
        [cat.name, cat.type, cat.color, cat.icon, cat.is_default]
      );
    }
  } else {
    const toEnsure = [
      { name: "Charges", type: "expense", color: "#E91E63", icon: "receipt", is_default: 1 },
      { name: "Épargne objectif", type: "expense", color: "#00897B", icon: "piggy-bank", is_default: 1 },
      { name: "Retrait associé", type: "expense", color: "#7E57C2", icon: "account-cash", is_default: 1 },
      { name: "Retrait mécanicien", type: "expense", color: "#9C27B0", icon: "account-cash", is_default: 1 },
    ];
    for (const cat of toEnsure) {
      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM categories WHERE name = ?",
        [cat.name]
      );
      if (!row || row.count === 0) {
        await database.runAsync(
          "INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, ?)",
          [cat.name, cat.type, cat.color, cat.icon, cat.is_default]
        );
      }
    }
  }

  const existingProprioName = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'proprio_name'"
  );
  if (!existingProprioName) {
    await database.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      ["proprio_name", "nassim louni"]
    );
  }

  const existingAssocieName = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'associe_name'"
  );
  if (!existingAssocieName) {
    await database.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      ["associe_name", "nassim 2"]
    );
  }
}
