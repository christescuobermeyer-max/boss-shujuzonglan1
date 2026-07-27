"use client";

import { useEffect, useMemo, useState } from "react";
import { buildBossApiUrl } from "@/lib/mobile-api-client";
import { formatMobileAmount } from "@/lib/mobile-dashboard";
import { getCurrentMonthValue, shiftMonthValue } from "@/lib/mobile-month";

type FinanceCity = "yichang" | "wuhan";
type FinanceCityParam = FinanceCity | "all";
type FinancePerson = "徐晓辉" | "吴思湘" | "盛亚娥";
type FinancePersonFilter = FinancePerson | "all";

type FinanceMonthPoint = {
  month: string;
  expenseAmount: number;
  expenseCount: number;
};

type FinancePersonSummary = {
  name: FinancePerson;
  months: FinanceMonthPoint[];
  totalExpenseAmount: number;
  totalExpenseCount: number;
};

type FinanceCitySummary = {
  city: FinanceCity;
  people: FinancePersonSummary[];
  cityTotal: {
    expenseAmount: number;
    expenseCount: number;
  };
};

type FinanceMonthlySummaryPayload =
  | (FinanceCitySummary & {
      range: { startMonth: string; endMonth: string };
    })
  | {
      city: "all";
      range: { startMonth: string; endMonth: string };
      cities: FinanceCitySummary[];
      grandTotal: {
        expenseAmount: number;
        expenseCount: number;
      };
    };

type FinanceTransaction = {
  id: number | string | null;
  date: string;
  amount: number;
  content: string;
  registrant: FinancePerson;
  timestamp?: string | null;
  hasPaymentImage: boolean;
  hasChatImage: boolean;
};

type FinanceTransactionsPayload = {
  city: FinanceCity;
  filters: {
    people: FinancePerson[];
    startMonth: string;
    endMonth: string;
    type: "expense";
  };
  data: FinanceTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type FinanceApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const FINANCE_PEOPLE: FinancePerson[] = ["徐晓辉", "吴思湘", "盛亚娥"];
const FINANCE_CITIES: { value: FinanceCityParam; label: string }[] = [
  { value: "all", label: "两地合计" },
  { value: "yichang", label: "宜昌" },
  { value: "wuhan", label: "武汉" }
];
const FINANCE_CITY_LABELS: Record<FinanceCity, string> = {
  yichang: "宜昌",
  wuhan: "武汉"
};

function formatMobileCount(value: number) {
  return Number(value ?? 0).toLocaleString("zh-CN");
}

function formatFinanceDate(value: string) {
  if (!value) return "未填日期";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getFinanceCitySummaries(summary: FinanceMonthlySummaryPayload | null): FinanceCitySummary[] {
  if (!summary) return [];
  if (summary.city === "all") return summary.cities;
  return [summary];
}

function getFinanceTotals(summary: FinanceMonthlySummaryPayload | null) {
  if (!summary) return { expenseAmount: 0, expenseCount: 0 };
  if (summary.city === "all") return summary.grandTotal;
  return summary.cityTotal;
}

function getFinancePeopleTotals(summary: FinanceMonthlySummaryPayload | null) {
  const totals = new Map<FinancePerson, { name: FinancePerson; amount: number; count: number }>();
  for (const person of FINANCE_PEOPLE) {
    totals.set(person, { name: person, amount: 0, count: 0 });
  }

  for (const citySummary of getFinanceCitySummaries(summary)) {
    for (const person of citySummary.people) {
      const current = totals.get(person.name) ?? { name: person.name, amount: 0, count: 0 };
      current.amount += Number(person.totalExpenseAmount ?? 0);
      current.count += Number(person.totalExpenseCount ?? 0);
      totals.set(person.name, current);
    }
  }

  return [...totals.values()]
    .filter((item) => item.amount > 0 || item.count > 0 || !summary)
    .map((item) => ({ ...item, amount: Math.round(item.amount * 100) / 100 }));
}

function getFinanceMonthlyRows(summary: FinanceMonthlySummaryPayload | null) {
  const citySummaries = getFinanceCitySummaries(summary);
  const months = new Set<string>();
  for (const citySummary of citySummaries) {
    for (const person of citySummary.people) {
      for (const month of person.months) months.add(month.month);
    }
  }

  return [...months].sort().map((month) => {
    const row = {
      month,
      yichangAmount: 0,
      wuhanAmount: 0,
      amount: 0,
      count: 0
    };
    for (const citySummary of citySummaries) {
      for (const person of citySummary.people) {
        const point = person.months.find((item) => item.month === month);
        if (!point) continue;
        if (citySummary.city === "yichang") row.yichangAmount += Number(point.expenseAmount ?? 0);
        if (citySummary.city === "wuhan") row.wuhanAmount += Number(point.expenseAmount ?? 0);
        row.amount += Number(point.expenseAmount ?? 0);
        row.count += Number(point.expenseCount ?? 0);
      }
    }
    return {
      ...row,
      yichangAmount: Math.round(row.yichangAmount * 100) / 100,
      wuhanAmount: Math.round(row.wuhanAmount * 100) / 100,
      amount: Math.round(row.amount * 100) / 100
    };
  }).reverse();
}

async function parseFinanceResponse<T>(response: Response, fallbackMessage: string) {
  if (response.status === 401) {
    window.location.href = "/mobile/login";
    return null;
  }

  const rawBody = await response.text();
  let body: FinanceApiResponse<T> | null = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error("财务接口返回异常，请稍后重试");
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.error || fallbackMessage);
  }

  return body.data ?? null;
}

function buildFinanceSummaryUrl(params: {
  city: FinanceCityParam;
  person: FinancePersonFilter;
  startMonth: string;
  endMonth: string;
}) {
  const searchParams = new URLSearchParams({
    city: params.city,
    startMonth: params.startMonth,
    endMonth: params.endMonth
  });
  if (params.person !== "all") searchParams.set("person", params.person);
  return buildBossApiUrl(`/api/mobile/finance/monthly-summary?${searchParams.toString()}`);
}

function buildFinanceTransactionsUrl(params: {
  city: FinanceCity;
  person: FinancePersonFilter;
  startMonth: string;
  endMonth: string;
  page: number;
}) {
  const searchParams = new URLSearchParams({
    city: params.city,
    startMonth: params.startMonth,
    endMonth: params.endMonth,
    page: String(params.page),
    limit: "10",
    sortBy: "date",
    sortOrder: "desc"
  });
  if (params.person !== "all") searchParams.set("person", params.person);
  return buildBossApiUrl(`/api/mobile/finance/transactions?${searchParams.toString()}`);
}

function FinanceTransactionCard({ item }: { item: FinanceTransaction }) {
  return (
    <article className="mobile-finance-transaction-card">
      <div className="mobile-aftersales-record-head">
        <strong>{item.content || "未填写内容"}</strong>
        <span>{formatMobileAmount(Number(item.amount ?? 0))}</span>
      </div>
      <div className="mobile-aftersales-record-meta">
        <span>{formatFinanceDate(item.date)}</span>
        <span>{item.registrant}</span>
        {item.id !== null && item.id !== undefined ? <span>编号 {item.id}</span> : null}
      </div>
      <div className="mobile-finance-transaction-flags">
        {item.hasPaymentImage ? <span>有付款图</span> : null}
        {item.hasChatImage ? <span>有聊天图</span> : null}
      </div>
    </article>
  );
}

export function MobileFinanceExpenseSection() {
  const currentMonth = useMemo(() => getCurrentMonthValue(), []);
  const [city, setCity] = useState<FinanceCityParam>("all");
  const [person, setPerson] = useState<FinancePersonFilter>("all");
  const [startMonth, setStartMonth] = useState(() => shiftMonthValue(currentMonth, -11));
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<FinanceMonthlySummaryPayload | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [transactionsByCity, setTransactionsByCity] = useState<Partial<Record<FinanceCity, FinanceTransactionsPayload>>>({});
  const [transactionLoadingByCity, setTransactionLoadingByCity] = useState<Partial<Record<FinanceCity, boolean>>>({});
  const [transactionErrorByCity, setTransactionErrorByCity] = useState<Partial<Record<FinanceCity, string>>>({});

  const summaryTotals = getFinanceTotals(summary);
  const peopleTotals = getFinancePeopleTotals(summary);
  const monthlyRows = getFinanceMonthlyRows(summary);
  const averageExpense = summaryTotals.expenseCount > 0
    ? summaryTotals.expenseAmount / summaryTotals.expenseCount
    : 0;
  const activeDetailCities: FinanceCity[] = city === "all" ? ["yichang", "wuhan"] : [city];

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    setSummaryError("");
    setDetailsExpanded(false);
    setTransactionsByCity({});
    setTransactionErrorByCity({});
    setTransactionLoadingByCity({});

    fetch(buildFinanceSummaryUrl({ city, person, startMonth, endMonth }), {
      credentials: "include"
    })
      .then((response) => parseFinanceResponse<FinanceMonthlySummaryPayload>(response, "财务汇总暂时无法加载"))
      .then((payload) => {
        if (!active || !payload) return;
        setSummary(payload);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSummary(null);
        setSummaryError(error instanceof Error ? error.message : "财务汇总暂时无法加载");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [city, endMonth, person, startMonth]);

  const loadTransactions = (targetCity: FinanceCity, page: number) => {
    setTransactionLoadingByCity((state) => ({ ...state, [targetCity]: true }));
    setTransactionErrorByCity((state) => ({ ...state, [targetCity]: "" }));

    fetch(buildFinanceTransactionsUrl({ city: targetCity, person, startMonth, endMonth, page }), {
      credentials: "include"
    })
      .then((response) => parseFinanceResponse<FinanceTransactionsPayload>(response, "财务明细暂时无法加载"))
      .then((payload) => {
        if (!payload) return;
        setTransactionsByCity((state) => {
          const current = state[targetCity];
          if (!current || page === 1) return { ...state, [targetCity]: payload };
          const existingIds = new Set(current.data.map((item, index) => `${item.id ?? "no-id"}-${item.date}-${index}`));
          const appended = payload.data.filter((item, index) => !existingIds.has(`${item.id ?? "no-id"}-${item.date}-${index}`));
          return {
            ...state,
            [targetCity]: {
              ...payload,
              data: [...current.data, ...appended]
            }
          };
        });
      })
      .catch((error: unknown) => {
        setTransactionErrorByCity((state) => ({
          ...state,
          [targetCity]: error instanceof Error ? error.message : "财务明细暂时无法加载"
        }));
      })
      .finally(() => {
        setTransactionLoadingByCity((state) => ({ ...state, [targetCity]: false }));
      });
  };

  const handleToggleDetails = () => {
    const nextExpanded = !detailsExpanded;
    setDetailsExpanded(nextExpanded);
    if (!nextExpanded) return;
    for (const detailCity of activeDetailCities) {
      if (!transactionsByCity[detailCity]) loadTransactions(detailCity, 1);
    }
  };

  return (
    <section className="mobile-section mobile-finance-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2>财务三人支出</h2>
          <span>{startMonth} 至 {endMonth} · 只读支出数据</span>
        </div>
        <strong className="mobile-work-total">{formatMobileAmount(summaryTotals.expenseAmount)}</strong>
      </div>

      <div className="mobile-finance-filters">
        <div className="mobile-finance-city-toggle" aria-label="财务城市筛选">
          {FINANCE_CITIES.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={city === option.value}
              onClick={() => setCity(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label>
          <span>人员</span>
          <select value={person} onChange={(event) => setPerson(event.target.value as FinancePersonFilter)}>
            <option value="all">全部三人</option>
            {FINANCE_PEOPLE.map((name) => (
              <option value={name} key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>开始月份</span>
          <input type="month" value={startMonth} max={endMonth} onChange={(event) => setStartMonth(event.target.value)} />
        </label>
        <label>
          <span>结束月份</span>
          <input type="month" value={endMonth} min={startMonth} max={currentMonth} onChange={(event) => setEndMonth(event.target.value)} />
        </label>
      </div>

      {summaryLoading ? <div className="mobile-work-loading">财务数据加载中</div> : null}
      {!summaryLoading && summaryError ? <div className="mobile-work-error">{summaryError}</div> : null}

      {!summaryLoading && !summaryError ? (
        <>
          <div className="mobile-finance-summary-grid">
            <div>
              <span>支出总额</span>
              <strong>{formatMobileAmount(summaryTotals.expenseAmount)}</strong>
            </div>
            <div>
              <span>交易笔数</span>
              <strong>{formatMobileCount(summaryTotals.expenseCount)}笔</strong>
            </div>
            <div>
              <span>平均每笔</span>
              <strong>{formatMobileAmount(averageExpense)}</strong>
            </div>
          </div>

          <div className="mobile-finance-people-list">
            {peopleTotals.length > 0 ? peopleTotals.map((item) => (
              <article className="mobile-finance-person-row" key={item.name}>
                <span>{item.name}</span>
                <strong>{formatMobileAmount(item.amount)}</strong>
                <em>{formatMobileCount(item.count)}笔</em>
              </article>
            )) : <div className="mobile-empty">该条件下暂无支出记录</div>}
          </div>

          {monthlyRows.length > 0 ? (
            <div className="mobile-finance-month-list">
              {monthlyRows.map((row) => (
                <article className="mobile-finance-month-row" key={row.month}>
                  <div>
                    <strong>{row.month}</strong>
                    <span>{formatMobileCount(row.count)}笔</span>
                  </div>
                  <div>
                    <span>合计</span>
                    <strong>{formatMobileAmount(row.amount)}</strong>
                  </div>
                  {city === "all" ? (
                    <div className="mobile-finance-month-city-split">
                      <span>宜昌 {formatMobileAmount(row.yichangAmount)}</span>
                      <span>武汉 {formatMobileAmount(row.wuhanAmount)}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          <button type="button" className="mobile-link-button mobile-finance-detail-toggle" onClick={handleToggleDetails}>
            {detailsExpanded ? "收起支出明细" : "查看支出明细"}
          </button>

          {detailsExpanded ? (
            <div className="mobile-finance-detail-list">
              {activeDetailCities.map((detailCity) => {
                const payload = transactionsByCity[detailCity];
                const loading = Boolean(transactionLoadingByCity[detailCity]);
                const error = transactionErrorByCity[detailCity] ?? "";
                return (
                  <div className="mobile-finance-detail-city" key={detailCity}>
                    <div className="mobile-finance-detail-city-head">
                      <strong>{FINANCE_CITY_LABELS[detailCity]}明细</strong>
                      {payload ? <span>{formatMobileCount(payload.pagination.total)}笔</span> : null}
                    </div>
                    {loading && !payload ? <div className="mobile-work-loading">明细加载中</div> : null}
                    {error ? <div className="mobile-work-error">{error}</div> : null}
                    {payload?.data.length ? payload.data.map((item, index) => (
                      <FinanceTransactionCard item={item} key={`${detailCity}-${item.id ?? index}-${item.date}`} />
                    )) : null}
                    {payload && payload.data.length === 0 ? <div className="mobile-empty">暂无支出明细</div> : null}
                    {payload?.pagination.hasNext ? (
                      <button
                        type="button"
                        className="mobile-link-button mobile-finance-load-more"
                        disabled={loading}
                        onClick={() => loadTransactions(detailCity, payload.pagination.page + 1)}
                      >
                        {loading ? "加载中" : "加载更多"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
