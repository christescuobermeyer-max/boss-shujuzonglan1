const WUHAN_SALES_NAMES = new Set(["屈维涛", "李帅", "向文强"]);

export function normalizeSalesCity(salesCity?: string | null) {
  const normalized = String(salesCity ?? "").trim();
  if (normalized === "武汉" || normalized === "宜昌") {
    return normalized;
  }
  return "";
}

export function resolveSalesCity(
  salesName?: string | null,
  preferredSalesCity?: string | null
) {
  const normalizedPreferred = normalizeSalesCity(preferredSalesCity);
  if (normalizedPreferred) {
    return normalizedPreferred;
  }

  const normalizedSalesName = String(salesName ?? "").trim();
  if (!normalizedSalesName) {
    return "";
  }

  return WUHAN_SALES_NAMES.has(normalizedSalesName) ? "武汉" : "宜昌";
}
