import type { ProvinceValueItem } from "@/lib/stats/types";
import { resolveProvinceMapName } from "@/lib/stats/province-map";

type ProvinceRegionItem = {
  name: string;
  itemStyle: {
    areaColor: string;
    borderColor: string;
    borderWidth: number;
  };
  label: {
    show: boolean;
    color: string;
    fontWeight: number;
  };
};

export function buildProvinceMapRegions(params: {
  data: ProvinceValueItem[];
  highlightedProvinces?: string[];
  activeProvince?: string;
}) {
  const highlightedSet = new Set(params.highlightedProvinces ?? []);

  return params.data.flatMap((item) => {
    const mapName = resolveProvinceMapName(item.name);
    if (!mapName) {
      return [];
    }

    if (item.name === params.activeProvince) {
      return [
        {
          name: mapName,
          itemStyle: {
            areaColor: "#ff8f66",
            borderColor: "#ff6b35",
            borderWidth: 2.4
          },
          label: {
            show: true,
            color: "#ffffff",
            fontWeight: 700
          }
        }
      ] satisfies ProvinceRegionItem[];
    }

    if (highlightedSet.has(item.name)) {
      return [
        {
          name: mapName,
          itemStyle: {
            areaColor: "#7fb2ff",
            borderColor: "#1677ff",
            borderWidth: 2
          },
          label: {
            show: true,
            color: "#ffffff",
            fontWeight: 700
          }
        }
      ] satisfies ProvinceRegionItem[];
    }

    return [];
  });
}
