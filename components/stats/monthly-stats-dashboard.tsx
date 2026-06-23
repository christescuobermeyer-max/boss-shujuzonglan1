"use client";

import { useEffect, useMemo, useState } from "react";
import { DailySummarySection } from "@/components/stats/daily-summary-section";
import { DashboardHeader } from "@/components/stats/dashboard-header";
import { DashboardMetricsSection } from "@/components/stats/dashboard-metrics-section";
import { DashboardOverviewSection } from "@/components/stats/dashboard-overview-section";
import {
  getNextAllowedMonth,
  getPreviousMonthValue
} from "@/lib/stats/month-rotation";
import { buildDailySummaryRows } from "@/lib/stats/daily-summary-rows";
import { buildDailyTotalAmountTrend } from "@/lib/stats/daily-total-amount-trend";
import {
  buildEmptyMonthlyStats,
  getCurrentMonthValue
} from "@/lib/stats/monthly-stats-defaults";
import { buildOperatorAmountRanking } from "@/lib/stats/operator-amount-ranking";
import { buildOperatorTerminationRanking } from "@/lib/stats/operator-termination-ranking";
import type { StatsMonthlyPayload } from "@/lib/stats/types";

export function MonthlyStatsDashboard() {
  const initialMonth = useMemo(() => getCurrentMonthValue(), []);
  const [month, setMonth] = useState(initialMonth);
  const [stats, setStats] = useState<StatsMonthlyPayload>(buildEmptyMonthlyStats(initialMonth));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateTime, setUpdateTime] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/stats/monthly?month=${month}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "统计数据加载失败");
        return result as StatsMonthlyPayload;
      })
      .then((result) => {
        if (!active) return;
        setStats(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "统计数据加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [month]);

  useEffect(() => {
    const syncUpdateTime = () => {
      const now = new Date();
      setUpdateTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 更新`
      );
    };

    syncUpdateTime();
    const timer = window.setInterval(() => {
      syncUpdateTime();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const dailyOrderData = stats.dailyOrderShopTrend.map((item) => ({
    label: String(item.date ?? ""),
    value: Number(item.count ?? 0)
  }));
  const salesDistributionData = stats.salesShopTrend.map((item) => ({
    label: String(item.name ?? "未分配"),
    value: Number(item.count ?? 0)
  }));
  const meituanTotalAmountTrendData = useMemo(
    () => buildDailyTotalAmountTrend(stats.meituanDailyPointAmountTrend),
    [stats.meituanDailyPointAmountTrend]
  );
  const elemeTotalAmountTrendData = useMemo(
    () => buildDailyTotalAmountTrend(stats.elemeDailyPointAmountTrend),
    [stats.elemeDailyPointAmountTrend]
  );
  const totalAmountTrendData = useMemo(
    () =>
      buildDailyTotalAmountTrend([
        ...stats.meituanDailyPointAmountTrend,
        ...stats.elemeDailyPointAmountTrend
      ]),
    [stats.elemeDailyPointAmountTrend, stats.meituanDailyPointAmountTrend]
  );
  const wuhanAmountTrendData = useMemo(
    () => buildDailyTotalAmountTrend(stats.wuhanDailyPointAmountTrend),
    [stats.wuhanDailyPointAmountTrend]
  );
  const terminationTotal = stats.operatorTerminationTrend.reduce(
    (sum, item) => sum + Number(item.count ?? 0),
    0
  );
  const wuhanShopCount = Number(
    stats.salesCityShopTrend.find((item) => item.name === "武汉")?.count ?? 0
  );
  const yichangShopCount = Number(
    stats.salesCityShopTrend.find((item) => item.name === "宜昌")?.count ?? 0
  );

  const salesTopItems = stats.salesShopTrend.slice(0, 8);
  const operatorTopItems = stats.operatorShopTrend.slice(0, 8);
  const operatorAmountTopItems = useMemo(
    () =>
      buildOperatorAmountRanking({
        meituanDailyPointAmountTrend: stats.meituanDailyPointAmountTrend,
        elemeDailyPointAmountTrend: stats.elemeDailyPointAmountTrend
      }),
    [stats.elemeDailyPointAmountTrend, stats.meituanDailyPointAmountTrend]
  );
  const operatorTerminationTopItems = useMemo(
    () => buildOperatorTerminationRanking(stats.operatorTerminationTrend),
    [stats.operatorTerminationTrend]
  );
  const dailySummaryRows = useMemo(
    () =>
      buildDailySummaryRows({
        dailyOrderShopTrend: stats.dailyOrderShopTrend,
        meituanDailyPointShopTrend: stats.meituanDailyPointShopTrend,
        meituanDailyPointAmountTrend: stats.meituanDailyPointAmountTrend,
        elemeDailyPointShopTrend: stats.elemeDailyPointShopTrend,
        elemeDailyPointAmountTrend: stats.elemeDailyPointAmountTrend,
        wuhanDailyPointAmountTrend: stats.wuhanDailyPointAmountTrend
      }),
    [
      stats.dailyOrderShopTrend,
      stats.elemeDailyPointAmountTrend,
      stats.elemeDailyPointShopTrend,
      stats.meituanDailyPointAmountTrend,
      stats.meituanDailyPointShopTrend,
      stats.wuhanDailyPointAmountTrend
    ]
  );
  const metricCards = [
    { label: "月总店铺数", value: loading ? "..." : stats.monthlyShopCount, accent: "blue" as const },
    {
      label: "本月武汉回款总金额",
      value: loading
        ? "..."
        : `¥${stats.wuhanMonthlyPointSummary.totalAmount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
      accent: "green" as const
    },
    { label: "本月抽点店铺数", value: loading ? "..." : stats.monthlyCommissionShopCount, accent: "teal" as const },
    {
      label: "本月回款总金额",
      value: loading
        ? "..."
        : `¥${stats.monthlyPointAmount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
      accent: "orange" as const
    },
    { label: "本月解约数", value: loading ? "..." : terminationTotal, accent: "green" as const },
    { label: "武汉部开单数", value: loading ? "..." : wuhanShopCount, accent: "orange" as const },
    { label: "宜昌部开单数", value: loading ? "..." : yichangShopCount, accent: "blue" as const }
  ];

  return (
    <main className="dashboard-shell">
      <DashboardHeader
        month={month}
        latestMonth={initialMonth}
        updateTime={updateTime}
        onChangeMonth={setMonth}
        onPrevMonth={() => setMonth((current) => getPreviousMonthValue(current))}
        onNextMonth={() => setMonth((current) => getNextAllowedMonth(current, initialMonth))}
      />

      {error ? <div className="error-box">{error}</div> : null}

      <DashboardMetricsSection items={metricCards} />

      <DashboardOverviewSection
        dailyOrderData={dailyOrderData}
        salesDistributionData={salesDistributionData}
        meituanTotalAmountTrendData={meituanTotalAmountTrendData}
        elemeTotalAmountTrendData={elemeTotalAmountTrendData}
        allDailyPointAmountTrendData={stats.allDailyPointAmountTrend}
        totalAmountTrendData={totalAmountTrendData}
        salesTopItems={salesTopItems}
        operatorTopItems={operatorTopItems}
        operatorAmountTopItems={operatorAmountTopItems}
        operatorTerminationTopItems={operatorTerminationTopItems}
        wuhanMonthlyPointSummary={stats.wuhanMonthlyPointSummary}
        monthlyPointAmount={stats.monthlyPointAmount}
        meituanMonthlyPointAmount={stats.meituanMonthlyPointAmount}
        elemeMonthlyPointAmount={stats.elemeMonthlyPointAmount}
        monthlyCommissionShopCount={stats.monthlyCommissionShopCount}
        wuhanShopCount={wuhanShopCount}
        yichangShopCount={yichangShopCount}
      />

      <DailySummarySection
        totalAmountTrendData={totalAmountTrendData}
        wuhanAmountTrendData={wuhanAmountTrendData}
        salesInvalidSummary={stats.salesInvalidSummary}
        rows={dailySummaryRows}
      />
    </main>
  );
}
