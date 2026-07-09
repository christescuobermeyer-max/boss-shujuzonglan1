export function normalizeSalesCity(salesCity?: string | null) {
  const normalized = String(salesCity ?? "").trim();
  if (normalized === "武汉" || normalized === "宜昌") {
    return normalized;
  }
  return "";
}

export function resolveSalesCity(
  _salesName?: string | null,
  preferredSalesCity?: string | null
) {
  return normalizeSalesCity(preferredSalesCity);
}
