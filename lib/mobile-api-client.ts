export function buildBossApiUrl(path: string) {
  const base = (
    process.env.NEXT_PUBLIC_BOSS_API_BASE ??
    "https://jxdlmtjubdkn.sealosbja.site"
  ).replace(/\/$/, "");
  return `${base}${path}`;
}

export function buildRecentSignedTerminationStatsUrl(month: string) {
  return buildBossApiUrl(
    `/api/termination/recent-signed-stats?month=${encodeURIComponent(month)}`
  );
}

export function buildAccountGenerationSummaryUrl() {
  return "https://gw.hbcsch.pw/api/admin/account-generation-summary";
}

export function buildResourceStatsUrl() {
  return "https://gw.hbcsch.pw/api/store-resources/stats/public-users";
}
