"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MobileOnlineShopTrendChart } from "@/components/mobile/mobile-boss-charts";
import { buildAllOnlineShopTrendUrl } from "@/lib/mobile-api-client";
import type { AllOnlineShopTrendResponse } from "@/lib/mobile-contracts";

const EMPTY_PAYLOAD: AllOnlineShopTrendResponse = {
  startDate: null,
  endDate: null,
  points: []
};

async function parseTrendResponse(response: Response) {
  if (response.status === 401) {
    window.location.href = "/mobile/login";
    return null;
  }

  const rawBody = await response.text();
  let result: unknown = null;
  try {
    result = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error("全部日期在线店铺趋势暂时无法加载");
  }

  if (!response.ok) {
    throw new Error("全部日期在线店铺趋势暂时无法加载");
  }

  return result as AllOnlineShopTrendResponse;
}

export function MobileAllOnlineShopTrend() {
  const idPrefix = useId();
  const sectionTitleId = `${idPrefix}-section-title`;
  const dialogTitleId = `${idPrefix}-dialog-title`;
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const [payload, setPayload] = useState<AllOnlineShopTrendResponse>(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(buildAllOnlineShopTrendUrl(), {
      credentials: "include"
    })
      .then(parseTrendResponse)
      .then((result) => {
        if (!active || !result) return;
        setPayload(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "全部日期在线店铺趋势暂时无法加载"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!fullScreen) return;

    const previousOverflow = document.body.style.overflow;
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFullScreen(false);
      window.setTimeout(() => maximizeButtonRef.current?.focus(), 0);
    };

    document.body.style.overflow = "hidden";
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullScreen]);

  const closeFullScreen = () => {
    setFullScreen(false);
    window.setTimeout(() => maximizeButtonRef.current?.focus(), 0);
  };
  const dateRange =
    payload.startDate && payload.endDate
      ? `${payload.startDate} 至 ${payload.endDate}`
      : "完整历史在线店铺走势";

  return (
    <section
      className="mobile-section mobile-all-online-shop-section"
      aria-labelledby={sectionTitleId}
    >
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2 id={sectionTitleId}>全部日期在线店铺趋势</h2>
          <span>{dateRange} · 总在线 · 美团 · 饿了么</span>
        </div>
        {payload.points.length > 0 ? (
          <button
            ref={maximizeButtonRef}
            type="button"
            className="mobile-icon-button"
            aria-label="最大化全部日期在线店铺趋势"
            title="最大化"
            onClick={() => setFullScreen(true)}
          >
            <Maximize2 size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mobile-all-online-shop-skeleton mobile-skeleton" />
      ) : null}
      {!loading && error ? <div className="mobile-empty">{error}</div> : null}
      {!loading && !error && payload.points.length === 0 ? (
        <div className="mobile-empty">暂无在线店铺历史数据</div>
      ) : null}
      {!loading && !error && payload.points.length > 0 ? (
        <div className="mobile-all-online-shop-chart-shell">
          <MobileOnlineShopTrendChart data={payload.points} />
        </div>
      ) : null}

      {fullScreen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="mobile-all-online-shop-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
            >
              <div className="mobile-all-online-shop-overlay-head">
                <div>
                  <h2 id={dialogTitleId}>全部日期在线店铺趋势</h2>
                  <span>{dateRange}</span>
                </div>
                <button
                  type="button"
                  className="mobile-icon-button"
                  aria-label="关闭全部日期在线店铺趋势全屏"
                  title="关闭"
                  autoFocus
                  onClick={closeFullScreen}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="mobile-all-online-shop-overlay-chart">
                <MobileOnlineShopTrendChart
                  data={payload.points}
                  height={Math.max(320, viewportHeight - 92)}
                  fullScreen
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
