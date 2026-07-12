import type { ProvinceValueItem } from "@/lib/stats/types";
import { resolveProvinceMapName } from "@/lib/stats/province-map";

type ProvinceSeriesItem = ProvinceValueItem & {
  itemStyle: {
    borderColor: string;
    borderWidth: number;
    shadowBlur?: number;
    shadowColor?: string;
  };
};

export function buildProvinceMapSeriesData(params: {
  data: ProvinceValueItem[];
  highlightedProvinces?: string[];
  activeProvince?: string;
}): ProvinceSeriesItem[] {
  const highlightedSet = new Set(params.highlightedProvinces ?? []);

  return params.data.map((item) => {
    const mapName = resolveProvinceMapName(item.name);
    const nextName = mapName || item.name;

    if (item.name === params.activeProvince) {
      return {
        ...item,
        name: nextName,
        itemStyle: {
          borderColor: "#ff6b35",
          borderWidth: 2.2,
          shadowBlur: 18,
          shadowColor: "rgba(255,107,53,0.3)"
        }
      };
    }

    if (highlightedSet.has(item.name)) {
      return {
        ...item,
        name: nextName,
        itemStyle: {
          borderColor: "#1677ff",
          borderWidth: 1.8,
          shadowBlur: 14,
          shadowColor: "rgba(22,119,255,0.24)"
        }
      };
    }

    if (item.value > 0) {
      return {
        ...item,
        name: nextName,
        itemStyle: {
          borderColor: "#7aaeff",
          borderWidth: 1.2,
          shadowBlur: 8,
          shadowColor: "rgba(22,119,255,0.14)"
        }
      };
    }

    return {
      ...item,
      name: nextName,
      itemStyle: {
        borderColor: "#c3d8ff",
        borderWidth: 0.7
      }
    };
  });
}
