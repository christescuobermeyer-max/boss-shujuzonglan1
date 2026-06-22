"use client";

import ReactECharts from "echarts-for-react";

export type BarChartDatum = {
  label: string;
  value: number;
};

export function buildBarChartOption({
  data,
  showAverageLine = false
}: {
  data: BarChartDatum[];
  showAverageLine?: boolean;
}) {
  const series = {
    type: "bar",
    data: data.map((item) => item.value),
    barMaxWidth: 28,
    itemStyle: {
      borderRadius: [6, 6, 0, 0],
      color: {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: "#4b94ff" },
          { offset: 1, color: "#1677ff" }
        ]
      }
    },
    ...(showAverageLine
      ? {
          markLine: {
            symbol: "none",
            label: {
              show: true,
              formatter: "平均值",
              color: "#4e5969",
              fontSize: 11
            },
            lineStyle: {
              type: "dashed",
              color: "#8fb5ff",
              width: 1.5
            },
            data: [{ type: "average" }]
          }
        }
      : {})
  };

  return {
    grid: { left: 20, right: 20, top: 36, bottom: 26, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#d9e2ef",
      textStyle: { color: "#1d2129" }
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        color: "#4e5969",
        fontSize: 11,
        rotate: 28,
        interval: 0,
        formatter: (value: string) =>
          value.length > 8 ? `${value.slice(0, 8)}…` : value
      },
      axisLine: { lineStyle: { color: "#e5e8ef" } }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#4e5969", fontSize: 11 },
      splitLine: { lineStyle: { color: "#eef2f8", type: "dashed" } }
    },
    series: [series]
  };
}

export function BarChart({
  data,
  height = 320,
  showAverageLine = false
}: {
  data: BarChartDatum[];
  height?: number | string;
  showAverageLine?: boolean;
}) {
  const option = buildBarChartOption({ data, showAverageLine });

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
