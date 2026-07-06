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
