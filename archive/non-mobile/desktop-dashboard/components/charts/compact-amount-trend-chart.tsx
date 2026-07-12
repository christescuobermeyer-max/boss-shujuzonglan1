"use client";

import ReactECharts from "echarts-for-react";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";

function formatAxisAmount(value: number) {
  return `￥${Math.round(value / 1000)}k`;
}

export function CompactAmountTrendChart({
  data,
  color,
  areaStartColor,
  areaEndColor,
  height = 198
}: {
  data: DailyAmountPoint[];
  color: string;
  areaStartColor: string;
  areaEndColor: string;
  height?: number;
}) {
  const option = {
    grid: { top: 6, bottom: 22, left: 52, right: 8 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#fff",
      borderColor: "#E5E8EF",
      textStyle: { color: "#1D2129", fontSize: 11 },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0]?.name ?? ""}<br/>回款额：<b>￥${Number(params[0]?.value ?? 0).toLocaleString("zh-CN", {
          maximumFractionDigits: 2
        })}</b>`
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.date),
      axisLabel: { color: "#86909C", fontSize: 8, interval: 4 },
      axisLine: { lineStyle: { color: "#E5E8EF" } }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#86909C",
        fontSize: 9,
        formatter: (value: number) => formatAxisAmount(value)
      },
      splitLine: { lineStyle: { color: "#F0F4FF" } }
    },
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbol: "none",
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: areaStartColor },
              { offset: 1, color: areaEndColor }
            ]
          }
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
