export type ServerEnv = {
  port: number;
  mongoUri: string;
  mobilePassword: string;
  mobileSessionSecret: string;
  bossWebOrigin: string;
  mobileCookieSameSite: "Lax" | "None";
  openApiBases: string[];
  openApiToken: string;
  openApiInsecureTlsBases: string[];
  financeMongoUri: string;
  financeDbYichang: string;
  financeDbWuhan: string;
  financeQueryTimeoutMs: number;
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

function parseSameSite(value: string | undefined): "Lax" | "None" {
  return value?.trim().toLowerCase() === "lax" ? "Lax" : "None";
}

export function getEnv(): ServerEnv {
  const mongoUri = requireEnv("MONGODB_URI");
  return {
    port: Number(process.env.PORT ?? 8789),
    mongoUri,
    mobilePassword: requireEnv("MOBILE_DASHBOARD_PASSWORD"),
    mobileSessionSecret: requireEnv("MOBILE_SESSION_SECRET"),
    bossWebOrigin: requireEnv("BOSS_WEB_ORIGIN"),
    mobileCookieSameSite: parseSameSite(process.env.MOBILE_COOKIE_SAME_SITE),
    openApiBases: parseList(
      process.env.CHENGSHANG_OPEN_API_BASES ||
        process.env.CHENGSHANG_OPEN_API_BASE
    ),
    openApiToken: requireEnv("CHENGSHANG_OPEN_API_TOKEN"),
    openApiInsecureTlsBases: parseList(
      process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES
    ),
    financeMongoUri: process.env.MONGODB_READONLY_URI?.trim() || mongoUri,
    financeDbYichang: process.env.MONGODB_DB_YICHANG?.trim() || "caiwu",
    financeDbWuhan: process.env.MONGODB_DB_WUHAN?.trim() || "wuhancaiwu",
    financeQueryTimeoutMs: Number(process.env.MONGO_QUERY_TIMEOUT_MS ?? 5000)
  };
}

