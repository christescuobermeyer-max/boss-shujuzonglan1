"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import {
  buildMapFocusActions,
  hasMapSeries
} from "@/lib/stats/map-focus";
import { resolveProvinceMapName } from "@/lib/stats/province-map";
import { buildProvinceMapRegions } from "@/lib/stats/province-map-regions";
import { buildProvinceMapSeriesData } from "@/lib/stats/province-map-style";
import type { ProvinceValueItem } from "@/lib/stats/types";

const MAP_NAME = "boss-shujuzonglan1-china";
const GEOJSON_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

export function ChinaProvinceMap({
  data,
  height = 440,
  activeProvince,
  highlightedProvinces = [],
  onProvinceHover
}: {
  data: ProvinceValueItem[];
  height?: number;
  activeProvince?: string;
  highlightedProvinces?: string[];
  onProvinceHover?: (provinceName: string | null) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const chartRef = useRef<ReactECharts | null>(null);
  const previousActiveProvince = useRef<string>("");

  useEffect(() => {
    let active = true;

    fetch(GEOJSON_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("GeoJSON 加载失败");
        }
        return response.json();
      })
      .then((geoJson) => {
        if (!active) return;
        echarts.registerMap(MAP_NAME, geoJson);
        setLoaded(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "GeoJSON 加载失败");
      });

    return () => {
      active = false;
    };
  }, []);

  const maxValue = useMemo(
    () => Math.max(...data.map((item) => item.value), 1),
    [data]
  );
  const highlightedSet = useMemo(
    () =>
      new Set(
        highlightedProvinces
          .map((name) => resolveProvinceMapName(name))
          .filter(Boolean)
      ),
    [highlightedProvinces]
  );
  const activeMapProvince = useMemo(
    () => resolveProvinceMapName(activeProvince ?? ""),
    [activeProvince]
  );
  const seriesData = useMemo(
    () =>
      buildProvinceMapSeriesData({
        data,
        highlightedProvinces,
        activeProvince
      }),
    [activeProvince, data, highlightedProvinces]
  );
  const regions = useMemo(
    () =>
      buildProvinceMapRegions({
        data,
        highlightedProvinces,
        activeProvince
      }),
    [activeProvince, data, highlightedProvinces]
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#d9e2ef",
        textStyle: { color: "#1d2129" },
        formatter: (params: { name: string; value?: number }) =>
          `${params.name}<br/>开单量：${Number(params.value ?? 0)}`
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 8,
        bottom: 8,
        text: ["高", "低"],
        itemWidth: 10,
        itemHeight: 72,
        textStyle: { color: "#86909c" },
        inRange: {
          color: ["#eef2f8", "#b3cfff", "#5b9aff", "#1677ff", "#003eb0"]
        }
      },
      series: [
        {
          type: "map",
          map: MAP_NAME,
          roam: false,
          data: seriesData,
          regions,
          nameProperty: "name",
          itemStyle: {
            borderColor: "#c3d8ff",
            borderWidth: 0.7
          },
          emphasis: {
            label: {
              show: true,
              color: "#fff",
              fontWeight: 700,
              formatter: (params: { name: string; value?: number }) =>
                `${params.name}\n${Number(params.value ?? 0)}`
            },
            itemStyle: { areaColor: "#ff6b35" }
          },
          label: {
            show: true,
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 600,
            formatter: (params: { name: string; value?: number }) => {
              if (
                params.name === activeMapProvince ||
                highlightedSet.has(params.name)
              ) {
                return `${Number(params.value ?? 0)}`;
              }
              return "";
            },
            textShadowColor: "rgba(0,0,0,0.28)",
            textShadowBlur: 4
          }
        }
      ]
    }),
    [activeMapProvince, highlightedSet, maxValue, regions, seriesData]
  );

  useEffect(() => {
    if (!loaded) return;
    const echartsInstance = chartRef.current?.getEchartsInstance();
    if (!echartsInstance) return;
    const hasSeries = hasMapSeries(echartsInstance.getOption());

    const actions = buildMapFocusActions({
      hasSeries,
      previousActiveProvince: previousActiveProvince.current,
      activeProvince: activeMapProvince || undefined
    });

    try {
      actions.forEach((action) => {
        echartsInstance.dispatchAction(action);
      });
    } catch {
      // 地图首次渲染的瞬间可能尚未建立完整 pipeline，此时跳过一次高亮同步。
    }

    previousActiveProvince.current = activeMapProvince || "";
  }, [activeMapProvince, loaded]);

  if (loadError) {
    return <div className="empty-chart" style={{ height }}>{loadError}</div>;
  }

  if (!loaded) {
    return <div className="empty-chart" style={{ height }}>中国地图加载中...</div>;
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      notMerge
      lazyUpdate
      style={{ height }}
      onEvents={{
        mouseover: (params: { name?: string }) => {
          onProvinceHover?.(params.name ?? null);
        },
        mouseout: () => {
          onProvinceHover?.(null);
        }
      }}
    />
  );
}
