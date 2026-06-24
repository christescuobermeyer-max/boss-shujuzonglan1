"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileAmountTrendChart } from "@/components/mobile/mobile-boss-charts";
import {
  buildEmptyMobileMonthlyStats,
  buildMobileDashboardData,
  formatMobileAmount,
  getVisibleDailyRepaymentRows,
  type MobileDashboardData,
  type MobileDailyRepaymentRow,
  type MobileMonthlyStatsPayload,
  type MobileRankItem
} from "@/lib/mobile-dashboard";
import {
  getNextAllowedMonth,
  getPreviousMonthValue
} from "@/lib/stats/month-rotation";
import {
  getCurrentMonthValue
} from "@/lib/stats/monthly-stats-defaults";

function formatMonthLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return value;
  return `${matched[1]}年${Number(matched[2])}月`;
}

function buildUpdateTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 更新`;
}

function RankingList({
  title,
  items,
  unit
}: {
  title: string;
  items: MobileRankItem[];
  unit: string;
}) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="mobile-section">
      <div className="mobile-section-head">
        <h2>{title}</h2>
      </div>
      <div className="mobile-rank-list">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div className="mobile-rank-row" key={`${title}-${item.name}`}>
              <span className="mobile-rank-index">{index + 1}</span>
              <div className="mobile-rank-main">
                <div className="mobile-rank-name">{item.name}</div>
                <div className="mobile-rank-track">
                  <span style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }} />
                </div>
              </div>
              <strong>{unit === "¥" ? formatMobileAmount(item.value) : `${item.value}${unit}`}</strong>
            </div>
          ))
        ) : (
          <div className="mobile-empty">暂无排行数据</div>
        )}
      </div>
    </section>
  );
}

function DailyRepaymentCard({ row }: { row: MobileDailyRepaymentRow }) {
  return (
    <article className="mobile-daily-card">
      <div className="mobile-daily-card-head">
        <span>{row.date}</span>
        <strong>{formatMobileAmount(row.totalAmount)}</strong>
      </div>
      <div className="mobile-daily-metrics">
        <div>
          <span>美团回款</span>
          <strong>{formatMobileAmount(row.meituanAmount)}</strong>
        </div>
        <div>
          <span>饿了么回款</span>
          <strong>{formatMobileAmount(row.elemeAmount)}</strong>
        </div>
        <div>
          <span>武汉回款</span>
          <strong>{formatMobileAmount(row.wuhanAmount)}</strong>
        </div>
        <div>
          <span>抽点店铺</span>
          <strong>{row.dailyPointShopCount}家</strong>
        </div>
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mobile-skeleton-stack" aria-label="数据加载中">
      <div className="mobile-skeleton mobile-skeleton-hero" />
      <div className="mobile-skeleton-grid">
        <div className="mobile-skeleton" />
        <div className="mobile-skeleton" />
        <div className="mobile-skeleton" />
      </div>
      <div className="mobile-skeleton mobile-skeleton-chart" />
    </div>
  );
}

export function MobileBossDashboard() {
  const initialMonth = useMemo(() => getCurrentMonthValue(), []);
  const [month, setMonth] = useState(initialMonth);
  const [stats, setStats] = useState<MobileMonthlyStatsPayload>(
    buildEmptyMobileMonthlyStats(initialMonth)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [updateTime, setUpdateTime] = useState(buildUpdateTime());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/mobile/stats/monthly?month=${month}`)
      .then(async (response) => {
        const result = await response.json();
        if (response.status === 401) {
          window.location.href = "/mobile/login";
          return null;
        }
        if (!response.ok) {
          throw new Error(result.message || "数据暂时无法加载，请稍后重试");
        }
        return result as MobileMonthlyStatsPayload;
      })
      .then((result) => {
        if (!active || !result) return;
        setStats(result);
        setUpdateTime(buildUpdateTime());
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "数据暂时无法加载，请稍后重试");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [month]);

  useEffect(() => {
    setExpanded(false);
  }, [month]);

  const dashboardData: MobileDashboardData = useMemo(
    () => buildMobileDashboardData(stats),
    [stats]
  );
  const visibleDailyRows = getVisibleDailyRepaymentRows(
    dashboardData.dailyRepaymentRows,
    expanded
  );

  return (
    <main className="mobile-page">
      <header className="mobile-header">
        <div>
          <p className="mobile-eyebrow">呈尚策划 · BOSS快看</p>
          <h1>手机快速看板</h1>
          <span>{formatMonthLabel(month)} · {updateTime}</span>
        </div>
        <div className="mobile-month-switcher">
          <button type="button" onClick={() => setMonth((value) => getPreviousMonthValue(value))}>
            ‹
          </button>
          <label>
            <span>{formatMonthLabel(month)}</span>
            <input
              type="month"
              value={month}
              max={initialMonth}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <button type="button" onClick={() => setMonth((value) => getNextAllowedMonth(value, initialMonth))}>
            ›
          </button>
        </div>
      </header>

      {error ? <div className="mobile-error">{error}</div> : null}
      {loading ? <LoadingSkeleton /> : null}

      {!loading ? (
        <>
          <section className="mobile-kpi-grid" aria-label="手机关键指标">
            {dashboardData.kpis.map((item) => (
              <article
                className={`mobile-kpi-card mobile-kpi-${item.accent}${item.prominent ? " mobile-kpi-card-primary" : ""}`}
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>

          {dashboardData.totalAmountTrendData.length > 0 ? (
            <section className="mobile-section">
              <div className="mobile-section-head">
                <h2>每日回款趋势</h2>
                <span>按日查看本月回款变化</span>
              </div>
              <MobileAmountTrendChart data={dashboardData.totalAmountTrendData} />
            </section>
          ) : null}

          {dashboardData.dailyRepaymentRows.length > 0 ? (
            <section className="mobile-section">
              <div className="mobile-section-head mobile-section-head-row">
                <div>
                  <h2>每日回款列表</h2>
                  <span>最新日期优先，展示平台与武汉拆分</span>
                </div>
                {dashboardData.dailyRepaymentRows.length > 7 ? (
                  <button
                    type="button"
                    className="mobile-link-button"
                    onClick={() => setExpanded((value) => !value)}
                  >
                    {expanded ? "收起" : "展开本月全部"}
                  </button>
                ) : null}
              </div>
              <div className="mobile-daily-list">
                {visibleDailyRows.map((row) => <DailyRepaymentCard key={row.date} row={row} />)}
              </div>
            </section>
          ) : null}

          <RankingList title="销售开单" items={dashboardData.rankings.sales} unit="家" />
          <RankingList title="运营回款" items={dashboardData.rankings.operatorAmount} unit="¥" />
          <RankingList title="解约" items={dashboardData.rankings.operatorTermination} unit="家" />
        </>
      ) : null}
    </main>
  );
}
