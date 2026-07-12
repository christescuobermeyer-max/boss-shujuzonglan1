export function getBottomAlignedStripMinHeight(params: {
  stripTop: number;
  targetBottom: number;
}) {
  if (params.targetBottom <= params.stripTop) {
    return null;
  }

  return Math.ceil(params.targetBottom - params.stripTop);
}
