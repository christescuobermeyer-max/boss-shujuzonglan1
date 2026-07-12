export function buildMetricGridTemplateColumns(cardCount: number) {
  const safeCount = Number.isFinite(cardCount) && cardCount > 0 ? Math.floor(cardCount) : 1;
  return `repeat(${safeCount}, minmax(0, 1fr))`;
}
