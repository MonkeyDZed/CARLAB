import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getAllTransactions, getTransactionSummary } from "../transactions/api";
import { getTotalCA, getTotalCAPaye } from "../ordres/api";
import { formatCurrency, formatShortDate } from "../../utils/format";
import { calculateBalance } from "../../utils/calculations";
import type { Transaction } from "../transactions/types";

function escapeCSV(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function exportCSV(): Promise<string> {
  const transactions = await getAllTransactions();
  const summary = await getTransactionSummary();
  const caReparations = await getTotalCA();
  const caEncaisses = await getTotalCAPaye();
  const balance = calculateBalance(summary);

  const header = "Date,Type,Catégorie,Description,Montant (DA),O.R.";
  const rows = transactions.map((tx) => {
    return [
      formatShortDate(tx.date),
      tx.type === "expense" ? "Dépense" : "Réparation",
      escapeCSV(tx.category),
      escapeCSV(tx.description ?? ""),
      tx.amount.toString(),
      tx.ordre_id ? `#${tx.ordre_id.slice(0, 6)}` : "",
    ].join(",");
  });

  const summaryRows = [
    "",
    "RÉSUMÉ",
    `Total dépenses,${summary.totalExpenses}`,
    `C.A. Réparations (facturé),${caReparations}`,
    `C.A. Encaissé,${caEncaisses}`,
    `Solde actuel,${balance}`,
    `Nombre de mouvements,${summary.movementCount}`,
  ];

  const csv = [header, ...rows, ...summaryRows].join("\n");

  const file = new File(Paths.cache, "garagecash_export.csv");
  file.create({ overwrite: true });
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Exporter en CSV",
  });

  return file.uri;
}

export async function exportPDF(): Promise<string> {
  const transactions = await getAllTransactions();
  const summary = await getTransactionSummary();
  const balance = calculateBalance(summary);

  const rows = transactions
    .map(
      (tx) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px;">${formatShortDate(tx.date)}</td>
      <td style="padding: 8px;">${tx.category}</td>
      <td style="padding: 8px;">${tx.description || "-"}</td>
      <td style="padding: 8px; text-align: right; color: #D32F2F;">-${tx.amount.toLocaleString("fr-FR")} DA</td>
    </tr>`
    )
    .join("");

  const categoryRows = summary.categoryBreakdown
    .map(
      (c) => `
    <tr>
      <td style="padding: 4px 8px;">${c.category}</td>
      <td style="padding: 4px 8px; text-align: right;">${c.total.toLocaleString("fr-FR")} DA</td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Garage Cash - Rapport</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 20px; color: #1A1A2E; }
    h1 { color: #1565C0; font-size: 20px; margin-bottom: 5px; }
    .date { color: #666; font-size: 12px; margin-bottom: 20px; }
    .summary { display: flex; gap: 10px; margin-bottom: 20px; }
    .card { background: #F5F7FA; border-radius: 8px; padding: 12px; flex: 1; text-align: center; }
    .card-label { font-size: 11px; color: #666; }
    .card-value { font-size: 18px; font-weight: 700; }
    .card-value.negative { color: #D32F2F; }
    .card-value.positive { color: #2E7D32; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #1565C0; font-size: 12px; color: #666; }
    h2 { font-size: 16px; color: #1565C0; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Garage Cash</h1>
  <div class="date">Rapport généré le ${new Date().toLocaleDateString("fr-FR")}</div>

  <div class="summary">
    <div class="card">
      <div class="card-label">Total dépenses</div>
      <div class="card-value negative">${summary.totalExpenses.toLocaleString("fr-FR")} DA</div>
    </div>
    <div class="card">
      <div class="card-label">Solde actuel</div>
      <div class="card-value positive">${balance.toLocaleString("fr-FR")} DA</div>
    </div>
  </div>

  <h2>Historique des dépenses</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Catégorie</th>
        <th>Description</th>
        <th style="text-align:right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <h2>Par catégorie</h2>
  <table>
    ${categoryRows}
  </table>

  <p style="color: #999; font-size: 10px; margin-top: 30px; text-align: center;">
    Garage Cash - Application de suivi de trésorerie
  </p>
</body>
</html>`;

  const { printToFileAsync } = await import("expo-print");
  const { uri } = await printToFileAsync({
    html,
    base64: false,
  });

  const pdfFile = new File(uri);
  const destFile = new File(Paths.cache, "garagecash_rapport.pdf");
  pdfFile.copy(destFile);

  await Sharing.shareAsync(destFile.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Exporter en PDF",
  });

  return destFile.uri;
}
