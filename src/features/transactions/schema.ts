import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./types";

export const transactionSchema = z.object({
  amount: z
    .number({ required_error: "Le montant est requis" })
    .positive("Le montant doit être positif")
    .max(999999999, "Montant trop élevé"),
  type: z.enum(["expense", "income"]),
  category: z.enum(EXPENSE_CATEGORIES, {
    required_error: "La catégorie est requise",
  }),
  description: z
    .string()
    .max(200, "Maximum 200 caractères")
    .optional()
    .or(z.literal("")),
  date: z.string().optional(),
  photoUri: z.string().optional().nullable(),
  ordreId: z.string().optional().nullable(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
