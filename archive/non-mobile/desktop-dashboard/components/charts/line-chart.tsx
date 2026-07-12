"use client";

import ReactECharts from "echarts-for-react";
import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";

const palette = ["#1677ff", "#13c2c2", "#ff6b35", "#52c41a", "#722ed1", "#faad14"];

function formatValue(value: number, valueType: "count" | "amount") {
  if (valueType === "amount") {
    return `¥${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value)}`;
  }
  return `${value}`;
}

export function LineChart({
  series,
  valueType,
  height = 320
}: {
  series: DailyTrendSeries[];
  valueType: "count" | "amount";
  height?: number;
}) {
  const dateSet = new Set<string>();
  series.forEach((item) => item.values.forEach((point) => dateSet.add(point.date)));
  const dates = Array.from(dateSet).sort((left, right) => left.localeCompare(right));

  const option = {
    color: palette,
    grid: { left: 28, right: 24, top: 44, bottom: 30, containLabel: true },
    legend: { top: 10, textStyle: { color: "#4e5969" } },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#d9e2ef",
      textStyle: { color: "#1d2129" },
      formatter: (params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) =>
        `<div><strong>${params[0]?.axisValue ?? ""}</strong>${params
          .map((item) => `<div>${item.marker}${item.seriesName}：${formatValue(Number(item.value ?? 0), valueType)}</div>`)
          .join("")}</div>`
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: "#4e5969", fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: "#e5e8ef" } }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#4e5969",
        formatter: (value: number) => formatValue(value, valueType)
      },
      splitLine: { lineStyle: { color: "#eef2f8", type: "dashed" } }
    },
    series: series.map((item) => {
      const valueByDate = new Map(item.values.map((point) => [point.date, point.value]));
      return {
        name: item.name || "未分配",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 3 },
        data: dates.map((date) => Number(valueByDate.get(date) ?? 0))
      };
    })
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
