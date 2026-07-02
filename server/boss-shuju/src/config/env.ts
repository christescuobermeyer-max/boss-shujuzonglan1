export type ServerEnv = {
  port: number;
  mongoUri: string;
  mobilePassword: string;
  mobileSessionSecret: string;
  bossWebOrigin: string;
  openApiBases: string[];
  openApiToken: string;
  openApiInsecureTlsBases: string[];
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function getEnv(): ServerEnv {
  return {
    port: Number(process.env.PORT ?? 8789),
    mongoUri: requireEnv("MONGODB_URI"),
    mobilePassword: requireEnv("MOBILE_DASHBOARD_PASSWORD"),
    mobileSessionSecret: requireEnv("MOBILE_SESSION_SECRET"),
    bossWebOrigin: requireEnv("BOSS_WEB_ORIGIN"),
    openApiBases: parseList(
      process.env.CHENGSHANG_OPEN_API_BASES ||
        process.env.CHENGSHANG_OPEN_API_BASE
    ),
    openApiToken: requireEnv("CHENGSHANG_OPEN_API_TOKEN"),
    openApiInsecureTlsBases: parseList(
      process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES
    )
  };
}

