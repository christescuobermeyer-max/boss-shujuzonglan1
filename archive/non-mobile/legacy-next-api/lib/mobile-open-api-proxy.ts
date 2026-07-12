const DEFAULT_OPEN_API_BASE = "https://8-136-183-128.sslip.io";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRY_COUNT = 2;

export type SerializedFetchError = {
  message: string;
  name: string;
  cause?: unknown;
};

export type OpenApiProxySuccess<T> = {
  ok: true;
  payload: T;
  upstreamUrl: string;
  upstreamStatus: number;
};

export type OpenApiProxyFailure = {
  ok: false;
  error: "missing_open_api_token" | "upstream_error" | "proxy_exception";
  message: string;
  upstreamUrl?: string;
  upstreamStatus?: number;
  detail?: unknown;
  attempts?: Array<{
    upstreamUrl: string;
    error: SerializedFetchError;
  }>;
};

type FetchOpenApiParams = {
  path: string;
  query?: string;
  logLabel: string;
};

type UpstreamResponse = Pick<Response, "ok" | "status" | "text">;

export function getOpenApiToken() {
  return (
    process.env.CHENGSHANG_OPEN_API_TOKEN || process.env.OPEN_API_TOKEN
  )?.trim();
}

function parseBaseList(configured?: string) {
  return (configured ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function getOpenApiBases() {
  const configured =
    process.env.CHENGSHANG_OPEN_API_BASES ||
    process.env.CHENGSHANG_OPEN_API_BASE ||
    DEFAULT_OPEN_API_BASE;

  return Array.from(
    new Set([
      ...parseBaseList(configured),
      ...getOpenApiInsecureTlsBases()
    ])
  );
}

export function getOpenApiInsecureTlsBases() {
  return parseBaseList(process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES);
}

export function shouldAllowInsecureTlsForUrl(upstreamUrl: string) {
  const url = new URL(upstreamUrl);
  return getOpenApiInsecureTlsBases().some((base) => {
    const baseUrl = new URL(base);
    return url.origin === baseUrl.origin;
  });
}

async function readUpstreamResponse(response: UpstreamResponse) {
  const rawBody = await response.text();
  if (!rawBody) return { payload: null, rawBody };
  try {
    return { payload: JSON.parse(rawBody), rawBody };
  } catch {
    return { payload: { rawBody }, rawBody };
  }
}

export function serializeFetchError(error: unknown): SerializedFetchError {
  if (!(error instanceof Error)) {
    return { message: "unknown_error", name: "unknown" };
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  const serializedCause =
    cause instanceof Error
      ? {
          name: cause.name,
          message: cause.message,
          code: (cause as Error & { code?: unknown }).code,
          errno: (cause as Error & { errno?: unknown }).errno,
          syscall: (cause as Error & { syscall?: unknown }).syscall,
          address: (cause as Error & { address?: unknown }).address,
          port: (cause as Error & { port?: unknown }).port
        }
      : cause;

  return {
    message: error.message,
    name: error.name,
    cause: serializedCause
  };
}

async function fetchWithInsecureTls(
  upstreamUrl: string,
  token: string,
  signal: AbortSignal
): Promise<UpstreamResponse> {
  const https = await import("node:https");
  const url = new URL(upstreamUrl);

  return await new Promise<UpstreamResponse>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        rejectUnauthorized: false,
        signal
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: async () => body
          });
        });
      }
    );

    request.on("error", reject);
    request.end();
  });
}

async function fetchWithTimeout(
  upstreamUrl: string,
  token: string
): Promise<UpstreamResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    if (shouldAllowInsecureTlsForUrl(upstreamUrl)) {
      return await fetchWithInsecureTls(upstreamUrl, token, controller.signal);
    }

    return await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchOpenApiJson<T>(
  params: FetchOpenApiParams
): Promise<OpenApiProxySuccess<T> | OpenApiProxyFailure> {
  const token = getOpenApiToken();
  const bases = getOpenApiBases();

  if (!token) {
    console.error(`${params.logLabel} open api token missing`, {
      bases,
      tokenConfigured: false
    });
    return {
      ok: false,
      error: "missing_open_api_token",
      message: "开放 API Token 未配置"
    };
  }

  const attempts: OpenApiProxyFailure["attempts"] = [];

  for (const base of bases) {
    const upstreamUrl = `${base}${params.path}${params.query ? `?${params.query}` : ""}`;

    for (let attempt = 1; attempt <= DEFAULT_RETRY_COUNT; attempt += 1) {
      try {
        const response = await fetchWithTimeout(upstreamUrl, token);
        const { payload, rawBody } = await readUpstreamResponse(response);

        if (!response.ok) {
          console.error(`${params.logLabel} open api upstream error`, {
            upstreamUrl,
            upstreamStatus: response.status,
            upstreamBodyPreview: rawBody.slice(0, 800),
            tokenConfigured: true,
            tokenLength: token.length
          });
          return {
            ok: false,
            error: "upstream_error",
            message: "上游开放 API 返回异常",
            upstreamUrl,
            upstreamStatus: response.status,
            detail: payload
          };
        }

        return {
          ok: true,
          payload: payload as T,
          upstreamUrl,
          upstreamStatus: response.status
        };
      } catch (error) {
        const serializedError = serializeFetchError(error);
        attempts.push({ upstreamUrl, error: serializedError });
        console.error(`${params.logLabel} open api proxy exception`, {
          upstreamUrl,
          attempt,
          maxAttempts: DEFAULT_RETRY_COUNT,
          ...serializedError,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  return {
    ok: false,
    error: "proxy_exception",
    message: "连接开放 API 失败",
    attempts
  };
}
