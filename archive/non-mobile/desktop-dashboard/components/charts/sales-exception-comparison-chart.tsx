"use client";

import ReactECharts from "echarts-for-react";
import type { SalesInvalidSummaryItem } from "@/lib/stats/sales-invalid-types";

export function buildSalesExceptionComparisonOption(data: SalesInvalidSummaryItem[]) {
  return {
    grid: { left: 30, right: 14, top: 40, bottom: 58, containLabel: true },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#4e5969", fontSize: 12 },
      data: ["15天零回款", "3天内解约"],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#d9e2ef",
      textStyle: { color: "#1d2129" },
      formatter: (params: Array<{ seriesName: string; value: number; dataIndex: number }>) => {
        const index = params[0]?.dataIndex ?? 0;
        const item = data[index];
        return [
          `<b>${item?.salesName ?? ""}</b>`,
          `15天零回款：${item?.invalidShopCount ?? 0} 家`,
          `3天内解约：${item?.terminatedWithinDaysCount ?? 0} 家`,
          `最终异常：${item?.finalShopCount ?? 0} 家`,
          `当月总开单：${item?.totalSignedShopCount ?? 0} 家`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.salesName),
      axisLabel: {
        color: "#4e5969",
        fontSize: 10,
        interval: 0,
        rotate: 24,
      },
      axisLine: { lineStyle: { color: "#e5e8ef" } },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#4e5969", fontSize: 11 },
      splitLine: { lineStyle: { color: "#eef2f8", type: "dashed" } },
    },
    series: [
      {
        name: "15天零回款",
        type: "bar",
        barMaxWidth: 14,
        itemStyle: { color: "#ff7d00", borderRadius: [8, 8, 0, 0] },
        label: { show: true, position: "top", color: "#1d2129", fontSize: 11 },
        data: data.map((item) => item.invalidShopCount),
      },
      {
        name: "3天内解约",
        type: "bar",
        barMaxWidth: 14,
        itemStyle: { color: "#f53f3f", borderRadius: [8, 8, 0, 0] },
        label: { show: true, position: "top", color: "#4e5969", fontSize: 11 },
        data: data.map((item) => item.terminatedWithinDaysCount),
      },
    ],
  };
}

export function SalesExceptionComparisonChart({
  data = [],
}: {
  data: SalesInvalidSummaryItem[];
}) {
  if (data.length === 0) {
    return <div className="empty-chart" style={{ height: 228 }}>当前月份暂无销售异常店铺</div>;
  }

  const option = buildSalesExceptionComparisonOption(data);
  const height = 228;

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
