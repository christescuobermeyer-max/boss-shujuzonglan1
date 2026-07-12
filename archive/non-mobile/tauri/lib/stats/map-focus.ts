type MapFocusAction = {
  type: "downplay" | "hideTip" | "highlight" | "showTip";
  seriesIndex: number;
  name?: string;
};

export function hasMapSeries(option: unknown) {
  if (!option || typeof option !== "object") {
    return false;
  }

  const series = (option as { series?: unknown }).series;
  return Array.isArray(series) && series.length > 0;
}

export function buildMapFocusActions(params: {
  hasSeries: boolean;
  previousActiveProvince?: string;
  activeProvince?: string;
}) {
  if (!params.hasSeries) {
    return [] as MapFocusAction[];
  }

  const actions: MapFocusAction[] = [];

  if (params.previousActiveProvince) {
    actions.push({
      type: "downplay",
      seriesIndex: 0,
      name: params.previousActiveProvince
    });
    actions.push({
      type: "hideTip",
      seriesIndex: 0
    });
  }

  if (params.activeProvince) {
    actions.push({
      type: "highlight",
      seriesIndex: 0,
      name: params.activeProvince
    });
    actions.push({
      type: "showTip",
      seriesIndex: 0,
      name: params.activeProvince
    });
  }

  return actions;
}
