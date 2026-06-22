"use client";

import ReactECharts from "echarts-for-react";
import type { BarChartDatum } from "@/components/charts/bar-chart";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";

function formatAxisAmount(value: number) {
  if (Math.abs(value) >= 10000) {
    return `${Math.round(value / 10000)}万`;
  }
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
}

export function MobileAmountTrendChart({
  data,
  height = 180
}: {
  data: DailyAmountPoint[];
  height?: number;
}) {
  const option = {
    grid: { top: 14, right: 10, bottom: 24, left: 42 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "#d9e2ef",
      textStyle: { color: "#1d2129", fontSize: 11 },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0]?.name ?? ""}<br/>回款：<b>¥${Number(params[0]?.value ?? 0).toLocaleString("zh-CN", {
          maximumFractionDigits: 2
        })}</b>`
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.date.slice(5)),
      axisLabel: { color: "#86909c", fontSize: 9, interval: 3 },
      axisLine: { lineStyle: { color: "#e5e8ef" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#86909c",
        fontSize: 9,
        formatter: (value: number) => formatAxisAmount(value)
      },
      splitLine: { lineStyle: { color: "#eef2f8", type: "dashed" } }
    },
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#16a34a", width: 2.5 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(22, 163, 74, 0.2)" },
              { offset: 1, color: "rgba(22, 163, 74, 0)" }
            ]
          }
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}

export function MobileOrderTrendChart({
  data,
  height = 180
}: {
  data: BarChartDatum[];
  height?: number;
}) {
  const option = {
    grid: { top: 14, right: 10, bottom: 24, left: 34 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "#d9e2ef",
      textStyle: { color: "#1d2129", fontSize: 11 }
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label.slice(5)),
      axisLabel: { color: "#86909c", fontSize: 9, interval: 3 },
      axisLine: { lineStyle: { color: "#e5e8ef" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#86909c", fontSize: 9 },
      splitLine: { lineStyle: { color: "#eef2f8", type: "dashed" } }
    },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barMaxWidth: 14,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: "#1677ff"
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
