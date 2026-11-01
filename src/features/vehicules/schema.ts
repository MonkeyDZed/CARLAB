import { z } from "zod";

export const vehiculeSchema = z.object({
  immatriculation: z.string().min(1, "L'immatriculation est requise").max(20),
  marque: z.string().max(50).optional().or(z.literal("")),
  modele: z.string().max(50).optional().or(z.literal("")),
  annee: z.number().int().min(1950).max(2100).optional().nullable(),
  telephone: z.string().max(20).optional().or(z.literal("")),
});

export type VehiculeFormData = z.infer<typeof vehiculeSchema>;
