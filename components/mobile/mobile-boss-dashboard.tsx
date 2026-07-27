"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { MobileAllOnlineShopTrend } from "@/components/mobile/mobile-all-online-shop-trend";
import { MobileAllRepaymentTrend } from "@/components/mobile/mobile-all-repayment-trend";
import { MobileFinanceExpenseSection } from "@/components/mobile/mobile-finance-expense-section";
import {
  MobileAmountTrendChart,
  MobileOrderTrendChart,
  MobilePlatformOrderTrendChart
} from "@/components/mobile/mobile-boss-charts";
import {
  buildAccountGenerationSummaryUrl,
  buildBossApiUrl,
  buildRecentSignedTerminationStatsUrl
} from "@/lib/mobile-api-client";
import {
  buildEmptyMobileMonthlyStats,
  buildMobileDashboardData,
  buildMonthlyDailyOrderAverage,
  buildPlatformDailyOrderAverages,
  formatMobileAmount,
  getVisibleDailyRepaymentRows,
  type MobileKpi,
  type MobileDashboardData,
  type MobileDailyRepaymentRow,
  type MobileMonthlyStatsPayload,
  type MobileRankItem
} from "@/lib/mobile-dashboard";
import {
  AFTERSALES_PERSON_FILTERS,
  buildEmptyAftersalesChargeStats,
  buildEmptyAftersalesDailyRecords,
  buildEmptyWorkflowDailyMonitor,
  buildWorkflowProgressRows,
  filterAftersalesRecords,
  formatOpenApiDateTime,
  getAftersalesShopCounts,
  getDefaultAftersalesDateKey,
  getShanghaiDateKey,
  getShanghaiMonthKey,
  mergeAftersalesChargeStatsPage,
  type AftersalesChargeStatsItem,
  type AftersalesChargeStatsPayload,
  type AftersalesChargeStatsPeriod,
  type AftersalesChargeStatsType,
  type AftersalesDailyRecordsPayload,
  type AftersalesPersonFilter,
  type AftersalesRecord,
  type WorkflowDailyMonitorPayload
} from "@/lib/mobile-work-boards";
import type {
  RecentSignedTerminationStatsResponse,
  TrendItem
} from "@/lib/mobile-contracts";
import {
  getCurrentMonthValue,
  getNextAllowedMonth,
  getPreviousMonthValue
} from "@/lib/mobile-month";

type AccountGenerationItem = {
  user_id: string;
  display_name: string;
  role: "admin" | "user" | string;
  is_active: boolean;
  created_at: string | null;
  last_login_at: string | null;
  total_count: number;
  month_count: number;
};

type AccountGenerationSummaryPayload = {
  month_start: string;
  month_end: string;
  accounts: AccountGenerationItem[];
};

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
  if (typeof message === "string") return message;
  return typeof responseObject.error === "string" ? responseObject.error : "";
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

function isOnlineShopKpi(label: string) {
  return label === "总在线店铺数" || label === "美团在线店铺数" || label === "饿了么在线店铺数";
}

function formatMobileDateLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return value || "今日";
  return `${Number(matched[2])}月${Number(matched[3])}日`;
}

function formatChargeStatsPeriodLabel(
  period: AftersalesChargeStatsPeriod,
  dateKey: string
) {
  if (period === "month") return formatMonthLabel(dateKey);
  return formatMobileDateLabel(dateKey);
}

const AFTERSALES_CHARGE_STATS_PAGE_SIZE = 20;

const AFTERSALES_CHARGE_STATS_CONFIGS = [
  {
    type: "paid-promotion",
    title: "付费推广统计",
    description: "付费推广充值收费登记",
    emptyText: "当前期间暂无付费推广收费记录"
  },
  {
    type: "auto-meal",
    title: "自动出餐统计",
    description: "自动出餐收费登记",
    emptyText: "当前期间暂无自动出餐收费记录"
  }
] as const satisfies ReadonlyArray<{
  type: AftersalesChargeStatsType;
  title: string;
  description: string;
  emptyText: string;
}>;

type AftersalesChargeStatsByType = Record<
  AftersalesChargeStatsType,
  AftersalesChargeStatsPayload
>;

type AftersalesChargeStatsBooleanByType = Record<
  AftersalesChargeStatsType,
  boolean
>;

type AftersalesChargeStatsErrorByType = Record<
  AftersalesChargeStatsType,
  string
>;

function buildEmptyChargeStatsByType(
  period: AftersalesChargeStatsPeriod,
  dateKey: string
): AftersalesChargeStatsByType {
  return {
    "paid-promotion": buildEmptyAftersalesChargeStats(
      "paid-promotion",
      period,
      dateKey
    ),
    "auto-meal": buildEmptyAftersalesChargeStats("auto-meal", period, dateKey)
  };
}

function buildAftersalesChargeStatsUrl(
  type: AftersalesChargeStatsType,
  period: AftersalesChargeStatsPeriod,
  dateKey: string,
  page: number
) {
  const params = new URLSearchParams({
    type,
    period,
    page: String(page),
    pageSize: String(AFTERSALES_CHARGE_STATS_PAGE_SIZE)
  });
  if (period === "month") {
    params.set("month", dateKey);
  } else {
    params.set("date", dateKey);
  }
  return buildBossApiUrl(`/api/mobile/aftersales/charge-stats?${params.toString()}`);
}

async function fetchAftersalesChargeStats(
  type: AftersalesChargeStatsType,
  period: AftersalesChargeStatsPeriod,
  dateKey: string,
  page: number
) {
  const response = await fetch(
    buildAftersalesChargeStatsUrl(type, period, dateKey, page),
    { credentials: "include" }
  );
  return parseMobileJsonResponse<AftersalesChargeStatsPayload>(
    response,
    "售后收费统计暂时无法加载，请稍后重试"
  );
}

function getChargeModeLabel(item: AftersalesChargeStatsItem) {
  if (item.rechargeMode === "auto") return "自动充值";
  if (item.rechargeMode === "manual") return "手动充值";
  return item.rechargeMode || "";
}

function getChargeDetailExtra(
  type: AftersalesChargeStatsType,
  item: AftersalesChargeStatsItem
) {
  if (type === "paid-promotion") return getChargeModeLabel(item);
  const duration = item.serviceDurationLabel || "";
  const expires = item.serviceExpiresOn ? `到期 ${item.serviceExpiresOn}` : "";
  return [duration, expires].filter(Boolean).join(" · ");
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

function formatTerminationRate(value: number) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

function MobileRecentSignedTerminationSection({
  data,
  loading,
  error
}: {
  data: RecentSignedTerminationStatsResponse | null;
  loading: boolean;
  error: string;
}) {
  const rows = data?.operatorStats ?? [];

  return (
    <section className="mobile-section mobile-recent-termination-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>解约</h2>
          <span>
            {data
              ? `${data.twoMonthSignedRange.startMonth}-${data.twoMonthSignedRange.endMonth} 签约，本月解约`
              : "上月 + 本月签约店铺中的解约情况"}
          </span>
        </div>
        <strong className="mobile-work-total">
          {loading ? "..." : `${formatMobileCount(data?.totalTerminatedCount ?? 0)}家`}
        </strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        rows.length > 0 ? (
          <div className="mobile-termination-table">
            <div className="mobile-termination-table-head">
              <span>运营名称</span>
              <span>解约数</span>
              <span>总数</span>
              <span>解约率</span>
            </div>
            {rows.slice(0, 8).map((item) => (
              <div className="mobile-termination-table-row" key={item.operatorName}>
                <span className="mobile-termination-operator">{item.operatorName}</span>
                <strong>{formatMobileCount(item.count)}</strong>
                <span>{formatMobileCount(item.twoMonthSignedShopCount)}</span>
                <strong className="mobile-termination-rate">
                  {formatTerminationRate(item.terminationRate)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-empty">暂无新签解约数据</div>
        )
      ) : null}
    </section>
  );
}

function formatGenerationPeriod(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    timeZone: "Asia/Shanghai"
  }).format(date);
}

function MobileAccountGenerationSection({
  data,
  loading,
  error
}: {
  data: AccountGenerationSummaryPayload | null;
  loading: boolean;
  error: string;
}) {
  const accounts = data?.accounts ?? [];
  const rows = accounts
    .slice()
    .sort((left, right) => {
      const monthDiff = Number(right.month_count ?? 0) - Number(left.month_count ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return Number(right.total_count ?? 0) - Number(left.total_count ?? 0);
    })
    .slice(0, 8);
  const monthTotal = accounts.reduce((sum, item) => sum + Number(item.month_count ?? 0), 0);
  const periodLabel = data?.month_start ? `${formatGenerationPeriod(data.month_start)}生图统计` : "本月生图统计";

  return (
    <section className="mobile-section mobile-generation-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>账号生图</h2>
          <span>{periodLabel} · 按账号展示本月与累计生图数</span>
        </div>
        <strong className="mobile-work-total">
          {loading ? "..." : `${formatMobileCount(monthTotal)}张`}
        </strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        rows.length > 0 ? (
          <div className="mobile-generation-table">
            <div className="mobile-generation-table-head">
              <span>账号</span>
              <span>本月</span>
              <span>累计</span>
            </div>
            {rows.map((item) => (
              <div className="mobile-generation-table-row" key={item.user_id}>
                <span className="mobile-generation-account">
                  {item.display_name || "未命名账号"}
                </span>
                <strong>{formatMobileCount(item.month_count)}张</strong>
                <span>{formatMobileCount(item.total_count)}张</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-empty">暂无账号生图数据</div>
        )
      ) : null}
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

function AftersalesChargeDetailCard({
  type,
  item
}: {
  type: AftersalesChargeStatsType;
  item: AftersalesChargeStatsItem;
}) {
  const extra = getChargeDetailExtra(type, item);

  return (
    <article className="mobile-aftersales-charge-detail">
      <div className="mobile-aftersales-record-head">
        <strong>{item.shopName || "未命名店铺"}</strong>
        <span>{formatMobileAmount(Number(item.amount ?? 0))}</span>
      </div>
      <div className="mobile-aftersales-record-meta">
        <span>{item.actionDate || "未填日期"}</span>
        <span>{item.operatorName || "未分配"}</span>
        <span>{item.deliveryPlatform || "未知平台"}</span>
      </div>
      <div className="mobile-aftersales-charge-submeta">
        {item.merchantId ? <span>商家ID {item.merchantId}</span> : null}
        {item.createdAt ? <span>提交 {item.createdAt}</span> : null}
        {extra ? <span>{extra}</span> : null}
      </div>
    </article>
  );
}

function MobileAftersalesChargeStatsSection({
  config,
  data,
  loading,
  error,
  loadingMore,
  onLoadMore
}: {
  config: (typeof AFTERSALES_CHARGE_STATS_CONFIGS)[number];
  data: AftersalesChargeStatsPayload;
  loading: boolean;
  error: string;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const items = data.details?.items ?? [];
  const detailTotal = Number(data.details?.total ?? items.length);
  const hasDetails = detailTotal > 0 || items.length > 0;
  const hasMore = items.length < detailTotal;

  useEffect(() => {
    setDetailsExpanded(false);
  }, [config.type, data.dateKey, data.period]);

  return (
    <section className="mobile-section mobile-aftersales-charge-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>{config.title}</h2>
          <span>
            {formatChargeStatsPeriodLabel(data.period, data.dateKey)} · {config.description} · {formatOpenApiDateTime(data.generatedAt)}
          </span>
        </div>
        <strong className="mobile-work-total">{formatMobileAmount(data.totalAmount)}</strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="mobile-aftersales-charge-summary">
            <div>
              <span>总金额</span>
              <strong>{formatMobileAmount(data.totalAmount)}</strong>
            </div>
            <div>
              <span>总笔数</span>
              <strong>{formatMobileCount(data.totalCount)}笔</strong>
            </div>
            <div>
              <span>登记人数</span>
              <strong>{formatMobileCount(data.employeeCount)}人</strong>
            </div>
          </div>

          {data.employees.length > 0 ? (
            <div className="mobile-aftersales-charge-employees">
              {data.employees.map((employee) => (
                <div
                  className="mobile-aftersales-charge-employee"
                  key={`${config.type}-${employee.operatorName}`}
                >
                  <span>{employee.operatorName || "未分配"}</span>
                  <strong>{formatMobileAmount(employee.totalAmount)}</strong>
                  <em>{formatMobileCount(employee.totalCount)}笔</em>
                </div>
              ))}
            </div>
          ) : null}

          {hasDetails ? (
            <button
              type="button"
              className="mobile-link-button mobile-aftersales-detail-toggle"
              onClick={() => setDetailsExpanded((value) => !value)}
            >
              {detailsExpanded
                ? "收起明细"
                : `查看明细（${formatMobileCount(detailTotal)}条）`}
            </button>
          ) : null}

          {detailsExpanded && items.length > 0 ? (
            <div className="mobile-aftersales-charge-detail-list">
              {items.map((item, index) => (
                <AftersalesChargeDetailCard
                  key={`${config.type}-${item.id || index}`}
                  type={config.type}
                  item={item}
                />
              ))}
            </div>
          ) : null}

          {detailsExpanded && hasDetails && items.length === 0 ? (
            <div className="mobile-empty">{config.emptyText}</div>
          ) : null}

          {detailsExpanded && hasMore ? (
            <button
              type="button"
              className="mobile-link-button mobile-aftersales-load-more"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? "加载中" : "加载更多"}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function MobileAftersalesDailySection({
  daily,
  loading,
  error,
  selectedDate,
  maxDate,
  onDateChange
}: {
  daily: AftersalesDailyRecordsPayload;
  loading: boolean;
  error: string;
  selectedDate: string;
  maxDate: string;
  onDateChange: (date: string) => void;
}) {
  const [selectedPerson, setSelectedPerson] =
    useState<AftersalesPersonFilter>("all");
  const initialChargeMonth = useMemo(() => getShanghaiMonthKey(), []);
  const initialChargeDate = useMemo(() => getShanghaiDateKey(), []);
  const [chargePeriod, setChargePeriod] =
    useState<AftersalesChargeStatsPeriod>("month");
  const [chargeMonth, setChargeMonth] = useState(initialChargeMonth);
  const [chargeDate, setChargeDate] = useState(initialChargeDate);
  const [chargeRefreshVersion, setChargeRefreshVersion] = useState(0);
  const chargeDateKey = chargePeriod === "month" ? chargeMonth : chargeDate;
  const chargeFilterKey = `${chargePeriod}:${chargeDateKey}`;
  const chargeFilterKeyRef = useRef(chargeFilterKey);
  const [chargeStats, setChargeStats] = useState<AftersalesChargeStatsByType>(
    () => buildEmptyChargeStatsByType("month", initialChargeMonth)
  );
  const [chargeLoading, setChargeLoading] =
    useState<AftersalesChargeStatsBooleanByType>({
      "paid-promotion": true,
      "auto-meal": true
    });
  const [chargeLoadingMore, setChargeLoadingMore] =
    useState<AftersalesChargeStatsBooleanByType>({
      "paid-promotion": false,
      "auto-meal": false
    });
  const [chargeErrors, setChargeErrors] =
    useState<AftersalesChargeStatsErrorByType>({
      "paid-promotion": "",
      "auto-meal": ""
    });
  const filteredRecords = filterAftersalesRecords(daily, selectedPerson);
  const shopCounts = getAftersalesShopCounts(daily);

  useEffect(() => {
    chargeFilterKeyRef.current = chargeFilterKey;
  }, [chargeFilterKey]);

  useEffect(() => {
    let active = true;
    const requestFilterKey = chargeFilterKey;

    setChargeStats(buildEmptyChargeStatsByType(chargePeriod, chargeDateKey));
    setChargeLoading({ "paid-promotion": true, "auto-meal": true });
    setChargeLoadingMore({ "paid-promotion": false, "auto-meal": false });
    setChargeErrors({ "paid-promotion": "", "auto-meal": "" });

    for (const config of AFTERSALES_CHARGE_STATS_CONFIGS) {
      fetchAftersalesChargeStats(config.type, chargePeriod, chargeDateKey, 1)
        .then((result) => {
          if (!active || !result || chargeFilterKeyRef.current !== requestFilterKey) return;
          setChargeStats((current) => ({
            ...current,
            [config.type]: result
          }));
        })
        .catch((requestError: unknown) => {
          if (!active || chargeFilterKeyRef.current !== requestFilterKey) return;
          setChargeErrors((current) => ({
            ...current,
            [config.type]: requestError instanceof Error
              ? requestError.message
              : "售后收费统计暂时无法加载，请稍后重试"
          }));
        })
        .finally(() => {
          if (!active || chargeFilterKeyRef.current !== requestFilterKey) return;
          setChargeLoading((current) => ({
            ...current,
            [config.type]: false
          }));
        });
    }

    return () => {
      active = false;
    };
  }, [chargeDateKey, chargeFilterKey, chargePeriod, chargeRefreshVersion]);

  const handleChargeLoadMore = (type: AftersalesChargeStatsType) => {
    const current = chargeStats[type];
    const nextPage = Number(current.details?.page ?? 1) + 1;
    const requestFilterKey = chargeFilterKey;

    setChargeLoadingMore((state) => ({ ...state, [type]: true }));
    setChargeErrors((state) => ({ ...state, [type]: "" }));

    fetchAftersalesChargeStats(type, chargePeriod, chargeDateKey, nextPage)
      .then((result) => {
        if (!result || chargeFilterKeyRef.current !== requestFilterKey) return;
        setChargeStats((state) => ({
          ...state,
          [type]: mergeAftersalesChargeStatsPage(state[type], result)
        }));
      })
      .catch((requestError: unknown) => {
        if (chargeFilterKeyRef.current !== requestFilterKey) return;
        setChargeErrors((state) => ({
          ...state,
          [type]: requestError instanceof Error
            ? requestError.message
            : "售后收费统计暂时无法加载，请稍后重试"
        }));
      })
      .finally(() => {
        if (chargeFilterKeyRef.current !== requestFilterKey) return;
        setChargeLoadingMore((state) => ({ ...state, [type]: false }));
      });
  };

  return (
    <>
      <section className="mobile-section mobile-aftersales-charge-filter-section">
        <div className="mobile-section-head mobile-section-head-row">
          <div>
            <h2>售后收费统计</h2>
            <span>{formatChargeStatsPeriodLabel(chargePeriod, chargeDateKey)} · 两个统计区共用筛选</span>
          </div>
          <button
            type="button"
            className="mobile-icon-button mobile-aftersales-refresh-button"
            onClick={() => setChargeRefreshVersion((value) => value + 1)}
            aria-label="刷新售后收费统计"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mobile-aftersales-charge-filter">
          <div className="mobile-aftersales-charge-period-toggle" aria-label="收费统计周期">
            <button
              type="button"
              aria-pressed={chargePeriod === "month"}
              onClick={() => setChargePeriod("month")}
            >
              按月
            </button>
            <button
              type="button"
              aria-pressed={chargePeriod === "day"}
              onClick={() => setChargePeriod("day")}
            >
              按日
            </button>
          </div>
          <label className="mobile-aftersales-charge-date">
            <span>{chargePeriod === "month" ? "统计月份" : "统计日期"}</span>
            {chargePeriod === "month" ? (
              <input
                type="month"
                value={chargeMonth}
                onChange={(event) => setChargeMonth(event.target.value)}
                aria-label="筛选售后收费统计月份"
              />
            ) : (
              <input
                type="date"
                value={chargeDate}
                onChange={(event) => setChargeDate(event.target.value)}
                aria-label="筛选售后收费统计日期"
              />
            )}
          </label>
        </div>
      </section>

      {AFTERSALES_CHARGE_STATS_CONFIGS.map((config) => (
        <MobileAftersalesChargeStatsSection
          key={config.type}
          config={config}
          data={chargeStats[config.type]}
          loading={chargeLoading[config.type]}
          error={chargeErrors[config.type]}
          loadingMore={chargeLoadingMore[config.type]}
          onLoadMore={() => handleChargeLoadMore(config.type)}
        />
      ))}

      <section className="mobile-section mobile-aftersales-section">
        <div className="mobile-section-head mobile-section-head-row mobile-aftersales-head">
          <div>
            <h2>售后每日工作</h2>
            <span>{formatMobileDateLabel(daily.dateKey)} · {formatOpenApiDateTime(daily.generatedAt)}</span>
          </div>
          <strong className="mobile-work-total">{formatMobileCount(filteredRecords.length)}条</strong>
        </div>
        <label className="mobile-aftersales-date-filter">
          <span>筛选日期</span>
          <input
            type="date"
            value={selectedDate}
            max={maxDate}
            onChange={(event) => onDateChange(event.target.value)}
            aria-label="筛选售后每日工作日期"
          />
        </label>
        <div className="mobile-aftersales-person-filter" aria-label="筛选售后人员">
          {AFTERSALES_PERSON_FILTERS.map((filter) => (
            <button
              type="button"
              className="mobile-aftersales-person-button"
              aria-pressed={selectedPerson === filter.value}
              onClick={() => setSelectedPerson(filter.value)}
              key={filter.value}
            >
              <span className="mobile-aftersales-person-count">
                {formatMobileCount(shopCounts[filter.value])}店
              </span>
              <span className="mobile-aftersales-person-label">{filter.label}</span>
            </button>
          ))}
        </div>

        {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
        {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

        {!loading && !error ? (
          filteredRecords.length > 0 ? (
            <div className="mobile-aftersales-record-list">
              {filteredRecords.map((record, index) => (
                <AftersalesRecordCard
                  key={`${record.operatorName}-${record.shopName}-${record.createdAt}-${index}`}
                  record={record}
                />
              ))}
            </div>
          ) : (
            <div className="mobile-empty">
              {selectedPerson === "all"
                ? "所选日期暂无售后记录"
                : "该人员当日暂无售后记录"}
            </div>
          )
        ) : null}
      </section>
    </>
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
  const initialAftersalesDate = useMemo(() => getDefaultAftersalesDateKey(), []);
  const maxAftersalesDate = useMemo(() => getShanghaiDateKey(), []);
  const [month, setMonth] = useState(initialMonth);
  const [shanghaiToday, setShanghaiToday] = useState(maxAftersalesDate);
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
  const [aftersalesDate, setAftersalesDate] = useState(initialAftersalesDate);
  const [recentSignedTerminationData, setRecentSignedTerminationData] =
    useState<RecentSignedTerminationStatsResponse | null>(null);
  const [recentSignedTerminationLoading, setRecentSignedTerminationLoading] = useState(true);
  const [recentSignedTerminationError, setRecentSignedTerminationError] = useState("");
  const [accountGenerationData, setAccountGenerationData] =
    useState<AccountGenerationSummaryPayload | null>(null);
  const [accountGenerationLoading, setAccountGenerationLoading] = useState(true);
  const [accountGenerationError, setAccountGenerationError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(buildBossApiUrl(`/api/mobile/stats/monthly?month=${month}`), {
      credentials: "include"
    })
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
    const refreshShanghaiDate = () => setShanghaiToday(getShanghaiDateKey());
    const timer = window.setInterval(refreshShanghaiDate, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    setRecentSignedTerminationLoading(true);
    setRecentSignedTerminationError("");
    fetch(buildRecentSignedTerminationStatsUrl(month), {
      credentials: "include"
    })
      .then((response) =>
        parseMobileJsonResponse<RecentSignedTerminationStatsResponse>(
          response,
          "解约统计暂时无法加载，请稍后重试"
        )
      )
      .then((terminationResult) => {
        if (!active || !terminationResult) return;
        setRecentSignedTerminationData(terminationResult);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setRecentSignedTerminationError(
          requestError instanceof Error ? requestError.message : "解约统计暂时无法加载，请稍后重试"
        );
        setRecentSignedTerminationData(null);
      })
      .finally(() => {
        if (active) setRecentSignedTerminationLoading(false);
      });

    return () => {
      active = false;
    };
  }, [month]);

  useEffect(() => {
    let active = true;

    setAccountGenerationLoading(true);
    setAccountGenerationError("");
    fetch(buildAccountGenerationSummaryUrl())
      .then((response) =>
        parseMobileJsonResponse<AccountGenerationSummaryPayload>(
          response,
          "账号生图统计暂时无法加载，请稍后重试"
        )
      )
      .then((generationResult) => {
        if (!active || !generationResult) return;
        setAccountGenerationData(generationResult);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setAccountGenerationError(
          requestError instanceof Error ? requestError.message : "账号生图统计暂时无法加载，请稍后重试"
        );
        setAccountGenerationData(null);
      })
      .finally(() => {
        if (active) setAccountGenerationLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setWorkflowLoading(true);
    setWorkflowError("");
    fetch(buildBossApiUrl("/api/mobile/workflow/daily-monitor"), {
      credentials: "include"
    })
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

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setAftersalesLoading(true);
    setAftersalesError("");
    fetch(buildBossApiUrl(`/api/mobile/aftersales/daily-records?date=${encodeURIComponent(aftersalesDate)}`), {
      credentials: "include"
    })
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
  }, [aftersalesDate]);

  const dashboardData: MobileDashboardData = useMemo(
    () => buildMobileDashboardData(stats),
    [stats]
  );
  const displayedDailyOrderTrendData = dashboardData.dailyOrderTrendData;
  const displayedDailyOrderPlatformTrendData =
    dashboardData.dailyOrderPlatformTrendData;
  const dailyOrderAverage = useMemo(
    () =>
      buildMonthlyDailyOrderAverage(
        stats.dailyOrderShopTrend,
        stats.month,
        shanghaiToday
      ),
    [shanghaiToday, stats.dailyOrderShopTrend, stats.month]
  );
  const platformDailyOrderAverages = useMemo(
    () =>
      buildPlatformDailyOrderAverages(
        stats.dailyOrderShopTrendByPlatform,
        stats.month,
        shanghaiToday
      ),
    [shanghaiToday, stats.dailyOrderShopTrendByPlatform, stats.month]
  );
  const mobileKpis = useMemo<MobileKpi[]>(() => {
    const recentTerminationKpi: MobileKpi = {
      label: "两个月解约数",
      value: recentSignedTerminationLoading
        ? "..."
        : String(Number(recentSignedTerminationData?.totalTerminatedCount ?? 0)),
      accent: "teal"
    };
    const insertIndex = dashboardData.kpis.findIndex((item) => item.label === "月总店铺数");

    if (insertIndex < 0) {
      return [...dashboardData.kpis, recentTerminationKpi];
    }

    return [
      ...dashboardData.kpis.slice(0, insertIndex + 1),
      recentTerminationKpi,
      ...dashboardData.kpis.slice(insertIndex + 1)
    ];
  }, [
    dashboardData.kpis,
    recentSignedTerminationData?.totalTerminatedCount,
    recentSignedTerminationLoading
  ]);
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
        <section className="mobile-kpi-grid" aria-label="手机关键指标">
            {mobileKpis.map((item) => (
              <article
                className={`mobile-kpi-card mobile-kpi-${item.accent}${item.prominent ? " mobile-kpi-card-primary" : ""}${isOnlineShopKpi(item.label) ? " mobile-kpi-online" : ""}`}
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                {item.note ? <small className="mobile-kpi-note">{item.note}</small> : null}
              </article>
            ))}
        </section>
      ) : null}

      <MobileAllOnlineShopTrend />

      {!loading ? (
        <>
          {dashboardData.totalAmountTrendData.length > 0 ? (
            <section className="mobile-section">
              <div className="mobile-section-head">
                <h2>每日回款趋势</h2>
                <span>按日查看本月回款变化</span>
              </div>
              <MobileAmountTrendChart data={dashboardData.totalAmountTrendData} />
            </section>
          ) : null}
        </>
      ) : null}

      <MobileAllRepaymentTrend />

      {!loading ? (
        <>
          <section className="mobile-section">
            <div className="mobile-section-head mobile-section-head-row">
              <div>
                <h2>每日开单趋势</h2>
                <span>按日查看本月新增开单数</span>
              </div>
              <strong
                className="mobile-work-total mobile-daily-order-average"
                aria-label={`当月每日平均开单数 ${dailyOrderAverage.toFixed(1)} 单`}
              >
                日均 {dailyOrderAverage.toFixed(1)}单
              </strong>
            </div>

            {displayedDailyOrderTrendData.length > 0 ? (
              <MobileOrderTrendChart data={displayedDailyOrderTrendData} />
            ) : null}

            {displayedDailyOrderPlatformTrendData.length > 0 ? (
              <div className="mobile-order-platform-trend">
                <div className="mobile-order-platform-trend-head">
                  <h3>美团 / 饿了么每日开单趋势</h3>
                  <span>按平台拆分本月新增开单数</span>
                </div>
                <div
                  className="mobile-order-platform-averages"
                  aria-label={`平台每日平均开单数 美团 ${platformDailyOrderAverages.meituan.toFixed(1)} 单 饿了么 ${platformDailyOrderAverages.eleme.toFixed(1)} 单`}
                >
                  <div>
                    <span>
                      <i className="mobile-order-platform-dot mobile-order-platform-dot-meituan" />
                      美团日均
                    </span>
                    <strong>{platformDailyOrderAverages.meituan.toFixed(1)}单</strong>
                  </div>
                  <div>
                    <span>
                      <i className="mobile-order-platform-dot mobile-order-platform-dot-eleme" />
                      饿了么日均
                    </span>
                    <strong>{platformDailyOrderAverages.eleme.toFixed(1)}单</strong>
                  </div>
                </div>
                <MobilePlatformOrderTrendChart
                  data={displayedDailyOrderPlatformTrendData}
                />
              </div>
            ) : null}

            {displayedDailyOrderTrendData.length === 0 ? (
              <div className="mobile-empty">暂无每日开单数据</div>
            ) : null}
          </section>

          {dashboardData.dailyRepaymentRows.length > 0 ? (
            <section className="mobile-section">
              <div className="mobile-section-head mobile-section-head-row">
                <div>
                  <h2>每日回款列表</h2>
                  <span>最新日期优先，展示平台与武汉拆分</span>
                </div>
                {dashboardData.dailyRepaymentRows.length > 3 ? (
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
          <MobileAccountGenerationSection
            data={accountGenerationData}
            loading={accountGenerationLoading}
            error={accountGenerationError}
          />
          <MobileRecentSignedTerminationSection
            data={recentSignedTerminationData}
            loading={recentSignedTerminationLoading}
            error={recentSignedTerminationError}
          />
          <MobileWorkflowProgressSection
            monitor={workflowMonitor}
            loading={workflowLoading}
            error={workflowError}
          />
          <MobileFinanceExpenseSection />
          <MobileAftersalesDailySection
            daily={aftersalesDaily}
            loading={aftersalesLoading}
            error={aftersalesError}
            selectedDate={aftersalesDate}
            maxDate={maxAftersalesDate}
            onDateChange={setAftersalesDate}
          />
        </>
      ) : null}
    </main>
  );
}
