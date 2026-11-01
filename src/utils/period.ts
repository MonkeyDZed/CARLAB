export type PeriodPreset = "all" | "month" | "year";

export interface PeriodRange {
  startDate?: string;
  endDate?: string;
}

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

export function presetToRange(
  preset: PeriodPreset,
  ref: Date = new Date()
): PeriodRange {
  if (preset === "all") return {};
  if (preset === "month") {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return {
      startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
    };
  }
  const start = new Date(ref.getFullYear(), 0, 1);
  const end = new Date(ref.getFullYear(), 11, 31);
  return {
    startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

export function presetLabel(preset: PeriodPreset): string {
  if (preset === "all") return "Tout";
  if (preset === "month") return "Mois";
  return "Année";
}

export const PERIOD_PRESETS: PeriodPreset[] = ["all", "month", "year"];
