export function buildBossApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_BOSS_API_BASE?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}
