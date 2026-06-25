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
  buildAftersalesEmployeeRows,
  buildEmptyAftersalesDailyRecords,
  buildEmptyWorkflowDailyMonitor,
  buildWorkflowProgressRows,
  formatOpenApiDateTime,
  getRecentAftersalesRecords,
  type AftersalesDailyRecordsPayload,
  type AftersalesRecord,
  type WorkflowDailyMonitorPayload
} from "@/lib/mobile-work-boards";
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

function getErrorMessage(result: unknown) {
  if (!result || typeof result !== "object" || !("message" in result)) {
    return "";
  }

  const responseObject = result as {
    message?: unknown;
    error?: unknown;
    detail?: { message?: unknown; error?: unknown };
    status?: unknown;
    upstreamStatus?: unknown;
  };
  if (responseObject.error === "missing_open_api_token") {
    return "开放 API Token 未配置";
  }
  if (
    responseObject.error === "upstream_error" &&
    (responseObject.status === 401 || responseObject.upstreamStatus === 401)
  ) {
    return "开放 API Token 无效";
  }
  const detailMessage =
    typeof responseObject.detail?.message === "string"
      ? responseObject.detail.message
      : "";
  if (detailMessage) return detailMessage;
  const message = responseObject.message;
  return typeof message === "string" ? message : "";
}

async function parseMobileJsonResponse<T>(
  response: Response,
  fallbackMessage: string
) {
  if (response.status === 401) {
    window.location.href = "/mobile/login";
    return null;
  }

  const rawBody = await response.text();
  let result: unknown = null;
  try {
    result = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error("数据接口返回异常，请稍后重试");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || fallbackMessage);
  }

  return result as T;
}

function formatMobileCount(value: number) {
  return Number(value ?? 0).toLocaleString("zh-CN");
}

function formatMobileDateLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return value || "今日";
  return `${Number(matched[2])}月${Number(matched[3])}日`;
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

function MobileWorkflowProgressSection({
  monitor,
  loading,
  error
}: {
  monitor: WorkflowDailyMonitorPayload;
  loading: boolean;
  error: string;
}) {
  const rows = buildWorkflowProgressRows(monitor, 8);
  const maxPending = Math.max(1, ...rows.map((item) => item.pendingShopCount));
  const flowTotal = (monitor.operatorStats ?? []).reduce(
    (sum, item) => sum + Number(item.flowPendingShopCount ?? 0),
    0
  );
  const patrolTotal = (monitor.operatorStats ?? []).reduce(
    (sum, item) => sum + Number(item.patrolPendingShopCount ?? 0),
    0
  );

  return (
    <section className="mobile-section mobile-work-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>运营工作进度</h2>
          <span>今日待处理 · {formatOpenApiDateTime(monitor.generatedAt)}</span>
        </div>
        <strong className="mobile-work-total">{formatMobileCount(monitor.totalPendingShops)}家</strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        rows.length > 0 ? (
          <>
            <div className="mobile-work-summary-grid">
              <div>
                <span>流程推进</span>
                <strong>{formatMobileCount(flowTotal)}</strong>
              </div>
              <div>
                <span>巡店标记</span>
                <strong>{formatMobileCount(patrolTotal)}</strong>
              </div>
            </div>
            <div className="mobile-work-progress-list">
              {rows.map((item) => (
                <article className="mobile-work-progress-row" key={item.operatorName}>
                  <div className="mobile-work-progress-head">
                    <strong>{item.operatorName}</strong>
                    <span>{formatMobileCount(item.pendingShopCount)}家</span>
                  </div>
                  <div className="mobile-work-progress-track">
                    <span style={{ width: `${Math.max(6, (item.pendingShopCount / maxPending) * 100)}%` }} />
                  </div>
                  <div className="mobile-work-progress-meta">
                    <span>流程 {formatMobileCount(item.flowPendingShopCount)}</span>
                    <span>巡店 {formatMobileCount(item.patrolPendingShopCount)}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="mobile-empty">暂无待处理工作</div>
        )
      ) : null}
    </section>
  );
}

function AftersalesRecordCard({ record }: { record: AftersalesRecord }) {
  return (
    <article className="mobile-aftersales-record">
      <div className="mobile-aftersales-record-head">
        <strong>{record.shopName || "未命名店铺"}</strong>
        <span>{record.actionLabel || record.actionType || "跟进"}</span>
      </div>
      <div className="mobile-aftersales-record-meta">
        <span>{record.operatorName || "未分配"}</span>
        <span>{record.deliveryPlatform || "未知平台"}</span>
        {record.shopStatus ? <span>{record.shopStatus}</span> : null}
      </div>
      {record.note ? <p>{record.note}</p> : null}
      {record.rechargeAmount ? (
        <div className="mobile-aftersales-recharge">
          点金充值 {formatMobileAmount(Number(record.rechargeAmount))}
        </div>
      ) : null}
    </article>
  );
}

function MobileAftersalesDailySection({
  daily,
  loading,
  error
}: {
  daily: AftersalesDailyRecordsPayload;
  loading: boolean;
  error: string;
}) {
  const employees = buildAftersalesEmployeeRows(daily, 6);
  const recentRecords = getRecentAftersalesRecords(daily, 6);

  return (
    <section className="mobile-section mobile-aftersales-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>售后每日工作</h2>
          <span>{formatMobileDateLabel(daily.dateKey)} · {formatOpenApiDateTime(daily.generatedAt)}</span>
        </div>
        <strong className="mobile-work-total">{formatMobileCount(daily.totalCount)}条</strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        daily.totalCount > 0 ? (
          <>
            <div className="mobile-aftersales-employee-grid">
              {employees.map((employee) => (
                <div className="mobile-aftersales-employee" key={employee.operatorName}>
                  <strong>{employee.operatorName}</strong>
                  <span>{formatMobileCount(employee.actionCount)}条 / {formatMobileCount(employee.shopCount)}店</span>
                </div>
              ))}
            </div>
            <div className="mobile-aftersales-record-list">
              {recentRecords.map((record, index) => (
                <AftersalesRecordCard
                  key={`${record.operatorName}-${record.shopName}-${record.createdAt}-${index}`}
                  record={record}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mobile-empty">暂无售后跟进记录</div>
        )
      ) : null}
    </section>
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
  const [workflowMonitor, setWorkflowMonitor] = useState<WorkflowDailyMonitorPayload>(
    buildEmptyWorkflowDailyMonitor()
  );
  const [aftersalesDaily, setAftersalesDaily] = useState<AftersalesDailyRecordsPayload>(
    buildEmptyAftersalesDailyRecords()
  );
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [aftersalesLoading, setAftersalesLoading] = useState(true);
  const [workflowError, setWorkflowError] = useState("");
  const [aftersalesError, setAftersalesError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/mobile/stats/monthly?month=${month}`)
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/mobile/login";
          return null;
        }

        const rawBody = await response.text();
        let result: unknown = null;
        try {
          result = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          throw new Error("数据接口返回异常，请稍后重试");
        }

        if (!response.ok) {
          throw new Error(getErrorMessage(result) || "数据暂时无法加载，请稍后重试");
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

  useEffect(() => {
    let active = true;

    setWorkflowLoading(true);
    setWorkflowError("");
    fetch("/api/mobile/workflow/daily-monitor")
      .then((response) =>
        parseMobileJsonResponse<WorkflowDailyMonitorPayload>(
          response,
          "运营工作进度暂时无法加载，请稍后重试"
        )
      )
      .then((workflowResult) => {
        if (!active || !workflowResult) return;
        setWorkflowMonitor(workflowResult);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setWorkflowError(
          requestError instanceof Error ? requestError.message : "运营工作进度暂时无法加载，请稍后重试"
        );
      })
      .finally(() => {
        if (active) setWorkflowLoading(false);
      });

    setAftersalesLoading(true);
    setAftersalesError("");
    fetch("/api/mobile/aftersales/daily-records")
      .then((response) =>
        parseMobileJsonResponse<AftersalesDailyRecordsPayload>(
          response,
          "售后每日工作暂时无法加载，请稍后重试"
        )
      )
      .then((aftersalesResult) => {
        if (!active || !aftersalesResult) return;
        setAftersalesDaily(aftersalesResult);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setAftersalesError(
          requestError instanceof Error ? requestError.message : "售后每日工作暂时无法加载，请稍后重试"
        );
      })
      .finally(() => {
        if (active) setAftersalesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
                {item.note ? <small className="mobile-kpi-note">{item.note}</small> : null}
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
          <MobileWorkflowProgressSection
            monitor={workflowMonitor}
            loading={workflowLoading}
            error={workflowError}
          />
          <MobileAftersalesDailySection
            daily={aftersalesDaily}
            loading={aftersalesLoading}
            error={aftersalesError}
          />
        </>
      ) : null}
    </main>
  );
}
