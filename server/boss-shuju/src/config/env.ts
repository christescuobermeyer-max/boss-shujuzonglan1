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
  return {
    port: Number(process.env.PORT ?? 8789),
    mongoUri: requireEnv("MONGODB_URI"),
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
    )
  };
}

