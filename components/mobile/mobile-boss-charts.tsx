"use client";

import ReactECharts from "echarts-for-react";
import type { BarChartDatum, DailyAmountPoint } from "@/lib/mobile-contracts";

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
      backgroundColor: "#ffffff",
      borderColor: "#eaeaea",
      textStyle: { color: "#000000", fontSize: 11 },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0]?.name ?? ""}<br/>回款：<b>¥${Number(params[0]?.value ?? 0).toLocaleString("zh-CN", {
          maximumFractionDigits: 2
        })}</b>`
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.date.slice(5)),
      axisLabel: { color: "#999999", fontSize: 9, interval: 3 },
      axisLine: { lineStyle: { color: "#eaeaea" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#999999",
        fontSize: 9,
        formatter: (value: number) => formatAxisAmount(value)
      },
      splitLine: { lineStyle: { color: "#f2f2f2", type: "dashed" } }
    },
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#000000", width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0, 0, 0, 0.12)" },
              { offset: 1, color: "rgba(0, 0, 0, 0)" }
            ]
          }
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}

function shouldShowHistoryDateLabel(params: {
  date: string;
  index: number;
  lastIndex: number;
  fullScreen: boolean;
}) {
  if (params.index === 0 || params.index === params.lastIndex) return true;
  if (!params.date.endsWith("-01")) return false;
  if (params.fullScreen) return true;

  const month = Number(params.date.slice(5, 7));
  return Number.isFinite(month) && (month - 1) % 3 === 0;
}

export function MobileAllRepaymentTrendChart({
  data,
  height = 220,
  fullScreen = false
}: {
  data: DailyAmountPoint[];
  height?: number | string;
  fullScreen?: boolean;
}) {
  const lastIndex = Math.max(0, data.length - 1);
  const option = {
    animation: false,
    grid: { top: 16, right: 12, bottom: 54, left: 48 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#eaeaea",
      textStyle: { color: "#000000", fontSize: 11 },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0]?.name ?? ""}<br/>总回款：<b>¥${Number(
          params[0]?.value ?? 0
        ).toLocaleString("zh-CN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</b>`
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisLabel: {
        color: "#999999",
        fontSize: 9,
        hideOverlap: true,
        interval: (index: number, value: string) =>
          shouldShowHistoryDateLabel({
            date: value,
            index,
            lastIndex,
            fullScreen
          }),
        formatter: (value: string) => value.slice(0, 7)
      },
      axisLine: { lineStyle: { color: "#eaeaea" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#999999",
        fontSize: 9,
        formatter: (value: number) => formatAxisAmount(value)
      },
      splitLine: { lineStyle: { color: "#f2f2f2", type: "dashed" } }
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      },
      {
        type: "slider",
        start: 0,
        end: 100,
        height: 16,
        bottom: 6,
        borderColor: "#eaeaea",
        backgroundColor: "#f7f7f7",
        fillerColor: "rgba(0, 0, 0, 0.12)",
        handleSize: 12,
        showDetail: false
      }
    ],
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#000000", width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0, 0, 0, 0.12)" },
              { offset: 1, color: "rgba(0, 0, 0, 0)" }
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
      backgroundColor: "#ffffff",
      borderColor: "#eaeaea",
      textStyle: { color: "#000000", fontSize: 11 }
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label.slice(5)),
      axisLabel: { color: "#999999", fontSize: 9, interval: 3 },
      axisLine: { lineStyle: { color: "#eaeaea" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#999999", fontSize: 9 },
      splitLine: { lineStyle: { color: "#f2f2f2", type: "dashed" } }
    },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barMaxWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#000000"
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
