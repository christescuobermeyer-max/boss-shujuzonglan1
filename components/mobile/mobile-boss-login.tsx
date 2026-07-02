"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { KeyboardEvent, Suspense, useState } from "react";
import { buildBossApiUrl } from "@/lib/mobile-api-client";

function MobileBossLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/mobile";

  async function handleSubmit() {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("请输入访问密码");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(buildBossApiUrl("/api/mobile/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: trimmedPassword })
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message || "密码错误，请重新输入");
        setPassword("");
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/mobile");
      router.refresh();
    } catch {
      setError("登录服务暂不可用");
    } finally {
      setSubmitting(false);
    }
  }

  function onPasswordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void handleSubmit();
    }
  }

  return (
    <main className="mobile-login-page">
      <section className="mobile-login-card">
        <div className="mobile-brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="mobile-eyebrow">呈尚策划 · BOSS快看</p>
        <h1>手机快速看板</h1>
        <p className="mobile-login-subtitle">请输入访问密码查看经营数据</p>

        <label className="mobile-login-label" htmlFor="mobile-password">
          访问密码
        </label>
        <input
          id="mobile-password"
          className="mobile-login-input"
          type="password"
          value={password}
          placeholder="请输入访问密码"
          autoFocus
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          onKeyDown={onPasswordKeyDown}
        />
        <div className="mobile-login-error">{error}</div>

        <button
          className="mobile-primary-button"
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "验证中..." : "进入快看"}
        </button>
      </section>
    </main>
  );
}

export function MobileBossLogin() {
  return (
    <Suspense fallback={<main className="mobile-login-page" />}>
      <MobileBossLoginInner />
    </Suspense>
  );
}
