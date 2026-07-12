"use client";

import { invoke, isTauri } from "@tauri-apps/api/core";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";
import { markDesktopLoggedIn, isDesktopLoggedIn } from "@/lib/desktop-auth";
import styles from "@/components/login/desktop-login-page.module.css";

export function DesktopLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isDesktopLoggedIn()) return;

    router.replace("/stats");
  }, [router]);

  async function handleLogin() {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("请输入访问密码");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (!isTauri()) throw new Error("当前页面不在桌面应用环境中");

      const matched = await invoke<boolean>("verify_login_password", {
        password: trimmedPassword
      });

      if (!matched) {
        setError("密码错误，请重新输入");
        setPassword("");
        return;
      }

      markDesktopLoggedIn();
      setSuccess(true);
      router.replace("/stats");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  function onPasswordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void handleLogin();
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.grid} />
      <section className={styles.wrap}>
        <div className={styles.markRow}>
          <BrandMark compact />
        </div>

        <div className={styles.card}>
          <header className={styles.brand}>
            <div className={styles.brandRow}>
              <BrandMark />
              <span className={styles.brandName}>呈尚策划</span>
            </div>
            <p className={styles.subtitle}>数据统计系统 · 内部管理平台</p>
          </header>

          {success ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.successText}>验证成功</div>
              <div className={styles.successSub}>正在进入数据统计系统…</div>
            </div>
          ) : (
            <>
              <div className={styles.group}>
                <label className={styles.label} htmlFor="desktop-login-password">
                  访问密码
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="desktop-login-password"
                    className={`${styles.input} ${error ? styles.inputError : ""}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="请输入访问密码"
                    autoFocus
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    onKeyDown={onPasswordKeyDown}
                  />
                  <button
                    type="button"
                    className={styles.eye}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "隐" : "显"}
                  </button>
                </div>
                <div className={styles.error}>{error}</div>
              </div>

              <button className={styles.button} type="button" disabled={submitting} onClick={() => void handleLogin()}>
                {submitting ? "验证中…" : "进入系统"}
              </button>
            </>
          )}
        </div>

        <footer className={styles.footer}>© 2025 呈尚策划 · 内部系统，禁止外部访问</footer>
      </section>
    </main>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <svg width="26" height="22" viewBox="0 0 44 32" fill="none">
        <rect x="2" y="20" width="8" height="8" rx="2" fill="#C3D8FF" />
        <rect x="14" y="14" width="8" height="14" rx="2" fill="#93BBFF" />
        <rect x="26" y="4" width="8" height="24" rx="2" fill="#1677FF" />
        <path d="M28 0L34 6M28 0L22 6" stroke="#1677FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
      <rect x="4" y="30" width="10" height="10" rx="2" fill="#C3D8FF" />
      <rect x="17" y="21" width="10" height="19" rx="2" fill="#93BBFF" />
      <rect x="30" y="10" width="10" height="30" rx="2" fill="#1677FF" />
      <path d="M32 6L38 12M32 6L26 12" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
