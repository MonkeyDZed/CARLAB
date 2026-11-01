import { z } from "zod";

export const ordreCreationSchema = z.object({
  vehicule_id: z.number({ required_error: "Véhicule requis" }),
  realisateur: z.enum(["proprio", "associe", "mecanicien"]).optional(),
  mecanicien_id: z.number().int().nullable().optional(),
  kilometrage: z
    .number()
    .int()
    .positive("Le kilométrage doit être positif")
    .optional()
    .nullable(),
});

export type OrdreCreationFormData = z.infer<typeof ordreCreationSchema>;

export const ordreMontantSchema = z.object({
  montant_total: z
    .number({ required_error: "Le montant est requis" })
    .positive("Le montant doit être positif")
    .max(999999999),
});

export type OrdreMontantFormData = z.infer<typeof ordreMontantSchema>;

export const paiementSchema = z.object({
  montant: z
    .number({ required_error: "Le montant est requis" })
    .positive("Le montant doit être positif"),
});

export type PaiementFormData = z.infer<typeof paiementSchema>;
