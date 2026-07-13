"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileAllRepaymentTrend } from "@/components/mobile/mobile-all-repayment-trend";
import {
  MobileAmountTrendChart,
  MobileOrderTrendChart
} from "@/components/mobile/mobile-boss-charts";
import {
  buildAccountGenerationSummaryUrl,
  buildBossApiUrl,
  buildRecentSignedTerminationStatsUrl,
  buildResourceStatsUrl
} from "@/lib/mobile-api-client";
import {
  buildEmptyMobileMonthlyStats,
  buildMobileDashboardData,
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
  buildEmptyAftersalesDailyRecords,
  buildEmptyWorkflowDailyMonitor,
  buildWorkflowProgressRows,
  filterAftersalesRecords,
  formatOpenApiDateTime,
  getAftersalesShopCounts,
  getDefaultAftersalesDateKey,
  getShanghaiDateKey,
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

type ResourceAccountStats = {
  accountId: string;
  username: string;
  todayCreatedCount: number;
  yesterdayCreatedCount: number;
  monthCreatedCount: number;
  totalCreatedCount: number;
};

type ResourceSalesStats = {
  accountId: string;
  username: string;
  todayFollowCount: number;
  yesterdayFollowCount: number;
  monthFollowCount: number;
  totalFollowCount: number;
  todayOwnCount: number;
  todayCustomerServiceCount: number;
  todayTotalCount: number;
  yesterdayOwnCount: number;
  yesterdayCustomerServiceCount: number;
  yesterdayTotalCount: number;
  monthOwnCount: number;
  monthCustomerServiceCount: number;
  monthTotalCount: number;
  totalOwnCount: number;
  totalCustomerServiceCount: number;
  totalCount: number;
};

type ResourceCustomerServiceStats = {
  accountId: string;
  username: string;
  todayAcceptedCount: number;
  yesterdayAcceptedCount: number;
  monthAcceptedCount: number;
  totalAcceptedCount: number;
  pendingHandoffCount: number;
  transferredCount: number;
};

type ResourceStatsPayload = {
  resourceAccounts: ResourceAccountStats[];
  customerService: ResourceCustomerServiceStats[];
  sales: ResourceSalesStats[];
  timezone: "Asia/Shanghai" | string;
  todayStart: number;
  todayEnd: number;
  yesterdayStart: number;
  yesterdayEnd: number;
  monthStart: number;
  monthEnd: number;
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

function ResourceStatsTable({
  title,
  rows,
  emptyText,
  accountLabel = "账号",
  getCounts
}: {
  title: string;
  rows: ResourceAccountStats[];
  emptyText: string;
  accountLabel?: string;
  getCounts: (item: ResourceAccountStats) => {
    today: number;
    yesterday: number;
    month: number;
    total: number;
  };
}) {
  const sortedRows = rows
    .slice()
    .sort((left, right) => {
      const leftCounts = getCounts(left);
      const rightCounts = getCounts(right);
      const monthDiff = Number(rightCounts.month ?? 0) - Number(leftCounts.month ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return Number(rightCounts.today ?? 0) - Number(leftCounts.today ?? 0);
    });

  return (
    <div className="mobile-resource-block">
      <h3>{title}</h3>
      {sortedRows.length > 0 ? (
        <div className="mobile-resource-table">
          <div className="mobile-resource-table-head">
            <span>{accountLabel}</span>
            <span>今日</span>
            <span>昨日</span>
            <span>本月</span>
            <span>总数</span>
          </div>
          {sortedRows.map((item) => {
            const counts = getCounts(item);
            return (
              <div className="mobile-resource-table-row" key={`${title}-${item.accountId}`}>
                <span className="mobile-resource-name">{item.username || "未命名账号"}</span>
                <strong>{formatMobileCount(counts.today)}</strong>
                <span>{formatMobileCount(counts.yesterday)}</span>
                <strong>{formatMobileCount(counts.month)}</strong>
                <span>{formatMobileCount(counts.total)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mobile-empty">{emptyText}</div>
      )}
    </div>
  );
}

function CustomerServiceResourceStatsTable({
  rows
}: {
  rows: ResourceCustomerServiceStats[];
}) {
  const sortedRows = rows
    .slice()
    .sort((left, right) => {
      const monthDiff =
        Number(right.monthAcceptedCount ?? 0) - Number(left.monthAcceptedCount ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return Number(right.todayAcceptedCount ?? 0) - Number(left.todayAcceptedCount ?? 0);
    });

  return (
    <div className="mobile-resource-block">
      <h3>客服资源统计</h3>
      {sortedRows.length > 0 ? (
        <div className="mobile-resource-table">
          <div className="mobile-resource-table-head mobile-resource-service-table-head">
            <span>客服</span>
            <span>今日</span>
            <span>昨日</span>
            <span>本月</span>
            <span>总数</span>
            <span>待转接</span>
            <span>已转接</span>
          </div>
          {sortedRows.map((item) => (
            <div
              className="mobile-resource-table-row mobile-resource-service-table-row"
              key={`客服资源统计-${item.accountId}`}
            >
              <span className="mobile-resource-name">{item.username || "未命名客服"}</span>
              <strong>{formatMobileCount(item.todayAcceptedCount)}</strong>
              <span>{formatMobileCount(item.yesterdayAcceptedCount)}</span>
              <strong>{formatMobileCount(item.monthAcceptedCount)}</strong>
              <span>{formatMobileCount(item.totalAcceptedCount)}</span>
              <strong>{formatMobileCount(item.pendingHandoffCount)}</strong>
              <span>{formatMobileCount(item.transferredCount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mobile-empty">暂无客服资源数据</div>
      )}
    </div>
  );
}

function ResourceSalesBreakdownCell({
  own,
  customerService,
  total
}: {
  own: number;
  customerService: number;
  total: number;
}) {
  return (
    <span className="mobile-resource-period-cell">
      <span className="mobile-resource-breakdown">
        <em>{formatMobileCount(own)}</em>
        <em>{formatMobileCount(customerService)}</em>
        <strong>{formatMobileCount(total)}</strong>
      </span>
    </span>
  );
}

function ResourceSalesPeriodHead({
  label
}: {
  label: string;
}) {
  return (
    <span className="mobile-resource-period-head">
      <b>{label}</b>
      <em>我的</em>
      <em>客服</em>
      <em>合计</em>
    </span>
  );
}

function SalesResourceStatsTable({ rows }: { rows: ResourceSalesStats[] }) {
  const sortedRows = rows
    .slice()
    .sort((left, right) => {
      const monthDiff = Number(right.monthTotalCount ?? 0) - Number(left.monthTotalCount ?? 0);
      if (monthDiff !== 0) return monthDiff;
      return Number(right.todayTotalCount ?? 0) - Number(left.todayTotalCount ?? 0);
    });

  return (
    <div className="mobile-resource-block">
      <h3>销售跟进统计</h3>
      {sortedRows.length > 0 ? (
        <div className="mobile-resource-table">
          <div className="mobile-resource-table-head mobile-resource-sales-table-head">
            <span>销售</span>
            <ResourceSalesPeriodHead label="今日" />
            <ResourceSalesPeriodHead label="昨日" />
            <ResourceSalesPeriodHead label="本月" />
            <ResourceSalesPeriodHead label="累计" />
            <span className="mobile-resource-sales-a11y-label">今日 我的 客服 合计</span>
          </div>
          {sortedRows.map((item) => (
            <div
              className="mobile-resource-table-row mobile-resource-sales-table-row"
              key={`销售跟进统计-${item.accountId}`}
            >
              <span className="mobile-resource-name">{item.username || "未命名销售"}</span>
              <ResourceSalesBreakdownCell
                own={Number(item.todayOwnCount ?? 0)}
                customerService={Number(item.todayCustomerServiceCount ?? 0)}
                total={Number(item.todayTotalCount ?? item.todayFollowCount ?? 0)}
              />
              <ResourceSalesBreakdownCell
                own={Number(item.yesterdayOwnCount ?? 0)}
                customerService={Number(item.yesterdayCustomerServiceCount ?? 0)}
                total={Number(item.yesterdayTotalCount ?? item.yesterdayFollowCount ?? 0)}
              />
              <ResourceSalesBreakdownCell
                own={Number(item.monthOwnCount ?? 0)}
                customerService={Number(item.monthCustomerServiceCount ?? 0)}
                total={Number(item.monthTotalCount ?? item.monthFollowCount ?? 0)}
              />
              <ResourceSalesBreakdownCell
                own={Number(item.totalOwnCount ?? 0)}
                customerService={Number(item.totalCustomerServiceCount ?? 0)}
                total={Number(item.totalCount ?? item.totalFollowCount ?? 0)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mobile-empty">暂无销售跟进数据</div>
      )}
    </div>
  );
}

function MobileResourceStatsSection({
  data,
  loading,
  error
}: {
  data: ResourceStatsPayload | null;
  loading: boolean;
  error: string;
}) {
  const resourceAccounts = data?.resourceAccounts ?? [];
  const customerService = data?.customerService ?? [];
  const sales = data?.sales ?? [];
  const monthCreatedTotal = resourceAccounts.reduce(
    (sum, item) => sum + Number(item.monthCreatedCount ?? 0),
    0
  );
  const monthCustomerServiceTotal = customerService.reduce(
    (sum, item) => sum + Number(item.monthAcceptedCount ?? 0),
    0
  );
  const monthSalesTotal = sales.reduce(
    (sum, item) => sum + Number(item.monthTotalCount ?? item.monthFollowCount ?? 0),
    0
  );

  return (
    <section className="mobile-section mobile-resource-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>资源统计</h2>
          <span>资源录入、客服领取、销售跟进三段纵向展示</span>
        </div>
        <strong className="mobile-work-total">
          {loading ? "..." : `${formatMobileCount(monthCreatedTotal + monthCustomerServiceTotal + monthSalesTotal)}`}
        </strong>
      </div>

      {loading ? <div className="mobile-work-loading">数据加载中</div> : null}
      {!loading && error ? <div className="mobile-work-error">{error}</div> : null}

      {!loading && !error ? (
        <div className="mobile-resource-stack">
          <ResourceStatsTable
            title="资源账号录入统计"
            rows={resourceAccounts}
            emptyText="暂无资源账号录入数据"
            getCounts={(item) => {
              return {
                today: Number(item.todayCreatedCount ?? 0),
                yesterday: Number(item.yesterdayCreatedCount ?? 0),
                month: Number(item.monthCreatedCount ?? 0),
                total: Number(item.totalCreatedCount ?? 0)
              };
            }}
          />
          <CustomerServiceResourceStatsTable rows={customerService} />
          <SalesResourceStatsTable rows={sales} />
        </div>
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
  const filteredRecords = filterAftersalesRecords(daily, selectedPerson);
  const shopCounts = getAftersalesShopCounts(daily);

  return (
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
  const [resourceStatsData, setResourceStatsData] = useState<ResourceStatsPayload | null>(null);
  const [resourceStatsLoading, setResourceStatsLoading] = useState(true);
  const [resourceStatsError, setResourceStatsError] = useState("");

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

    setResourceStatsLoading(true);
    setResourceStatsError("");
    fetch(buildResourceStatsUrl())
      .then((response) =>
        parseMobileJsonResponse<ResourceStatsPayload>(
          response,
          "资源统计暂时无法加载，请稍后重试"
        )
      )
      .then((resourceResult) => {
        if (!active || !resourceResult) return;
        setResourceStatsData(resourceResult);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setResourceStatsError(
          requestError instanceof Error ? requestError.message : "资源统计暂时无法加载，请稍后重试"
        );
        setResourceStatsData(null);
      })
      .finally(() => {
        if (active) setResourceStatsLoading(false);
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
        <>
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

          {dashboardData.totalAmountTrendData.length > 0 ? (
            <section className="mobile-section">
              <div className="mobile-section-head">
                <h2>每日回款趋势</h2>
                <span>按日查看本月回款变化</span>
              </div>
              <MobileAmountTrendChart data={dashboardData.totalAmountTrendData} />
            </section>
          ) : null}

          <MobileAllRepaymentTrend />

          <section className="mobile-section">
            <div className="mobile-section-head">
              <h2>每日开单趋势</h2>
              <span>按日查看本月新增开单数</span>
            </div>

            {displayedDailyOrderTrendData.length > 0 ? (
              <MobileOrderTrendChart data={displayedDailyOrderTrendData} />
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

          <MobileResourceStatsSection
            data={resourceStatsData}
            loading={resourceStatsLoading}
            error={resourceStatsError}
          />
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
