export type TransactionType = "expense" | "income";

export const EXPENSE_CATEGORIES = [
  "Achat matériel",
  "Loyer",
  "Consommables",
  "Charges",
  "Épargne objectif",
  "Retrait associé",
  "Retrait mécanicien",
  "Investissement",
  "Autre",
  "Réparation",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const COMMUNE_CATEGORIES: string[] = [
  "Achat matériel",
  "Loyer",
  "Consommables",
  "Charges",
  "Épargne objectif",
  "Investissement",
  "Autre",
];

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  photo_uri: string | null;
  date: string;
  partner_id: number | null;
  ordre_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  totalExpenses: number;
  totalIncomes: number;
  movementCount: number;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
  }[];
}

export interface TransactionFilter {
  search?: string;
  category?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

export const CATEGORY_LABEL = {
  "Achat matériel": "Achat matériel",
  Loyer: "Loyer",
  Consommables: "Consommables",
  Charges: "Charges",
  "Épargne objectif": "Épargne objectif",
  "Retrait associé": "Retrait associé",
  "Retrait mécanicien": "Retrait mécanicien",
  Investissement: "Investissement",
  Autre: "Autre",
  Réparation: "Réparation",
} as const;
