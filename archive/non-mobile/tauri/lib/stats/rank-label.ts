export function formatTopRankLabel(rank: number) {
  const safeRank = Number.isFinite(rank) && rank > 0 ? Math.floor(rank) : 1;
  return `第${safeRank}名`;
}
