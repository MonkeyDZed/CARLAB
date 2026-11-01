export function calculateCommission(montant: number, percent: number): number {
  if (!(montant > 0) || !(percent > 0)) return 0;
  return Math.round(montant * percent) / 100;
}

export function split50(montant: number): [number, number] {
  const part1 = Math.round((montant / 2) * 100) / 100;
  const part2 = Math.round((montant - part1) * 100) / 100;
  return [part1, part2];
}

export function calculateObjectifProgression(
  cumul: number,
  cible: number
): { cumul: number; cible: number; reste: number; pourcentage: number } {
  const safeCible = Math.max(0, cible);
  const reste = Math.max(0, safeCible - cumul);
  const pourcentage =
    safeCible > 0 ? Math.min(100, Math.round((cumul / safeCible) * 100)) : 0;
  return { cumul, cible: safeCible, reste, pourcentage };
}
