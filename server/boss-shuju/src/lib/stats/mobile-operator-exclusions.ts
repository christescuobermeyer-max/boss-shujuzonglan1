const EXCLUDED_MOBILE_OPERATOR_NAMES = new Set(["王涛"]);

export function isExcludedMobileOperatorName(value: unknown) {
  const name = value == null ? "" : String(value).trim();
  return EXCLUDED_MOBILE_OPERATOR_NAMES.has(name);
}
