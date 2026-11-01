import { z } from "zod";

const montantPositif = (label: string) =>
  z
    .number({ required_error: `${label} est requis` })
    .positive(`${label} doit être positif`)
    .max(999999999, `${label} trop élevé`);

const dateOptionnelle = z.string().optional().or(z.literal(""));

export const mecanicienSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  commissionPercent: z
    .number({ required_error: "La commission est requise" })
    .min(0, "La commission doit être positive ou nulle")
    .max(100, "La commission ne peut pas dépasser 100 %"),
});

export type MecanicienFormData = z.infer<typeof mecanicienSchema>;

export const retraitMecanicienSchema = z.object({
  mecanicienId: z.number({ required_error: "Mécanicien requis" }).int(),
  montant: montantPositif("Le montant"),
  date: dateOptionnelle,
  description: z.string().max(200).optional().or(z.literal("")),
});

export type RetraitMecanicienFormData = z.infer<
  typeof retraitMecanicienSchema
>;

export const retraitAssocieSchema = z.object({
  cible: z.enum(["proprio", "associe"], {
    required_error: "Associé requis",
  }),
  montant: montantPositif("Le montant"),
  date: dateOptionnelle,
  description: z.string().max(200).optional().or(z.literal("")),
});

export type RetraitAssocieFormData = z.infer<typeof retraitAssocieSchema>;

export const objectifSchema = z.object({
  montantCible: montantPositif("Le montant cible"),
  dateDebut: dateOptionnelle,
  description: z.string().max(200).optional().or(z.literal("")),
});

export type ObjectifFormData = z.infer<typeof objectifSchema>;

export const alimentationSchema = z.object({
  montant: montantPositif("Le montant"),
  date: dateOptionnelle,
  description: z.string().max(200).optional().or(z.literal("")),
});

export type AlimentationFormData = z.infer<typeof alimentationSchema>;
