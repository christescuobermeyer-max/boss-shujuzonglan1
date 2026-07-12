import areas from "china-division/dist/areas.json";
import cities from "china-division/dist/cities.json";
import provinces from "china-division/dist/provinces.json";

type ProvinceRow = {
  code: string;
  name: string;
};

type CityRow = {
  code: string;
  name: string;
  provinceCode: string;
};

type AreaRow = {
  code: string;
  name: string;
  cityCode: string;
  provinceCode: string;
};

const provinceRows = provinces as ProvinceRow[];
const cityRows = cities as CityRow[];
const areaRows = areas as AreaRow[];

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function stripLocationNoise(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/[()（）【】\[\]·•]/g, "")
    .replace(/主营[:：].*$/g, "")
    .replace(/店铺.*$/g, "")
    .replace(/门店.*$/g, "")
    .replace(/\d{6,}/g, "");
}

function normalizeProvinceLabel(name: string) {
  return name
    .replace(/省$/g, "")
    .replace(/市$/g, "")
    .replace(/壮族自治区$/g, "")
    .replace(/回族自治区$/g, "")
    .replace(/维吾尔自治区$/g, "")
    .replace(/自治区$/g, "")
    .replace(/特别行政区$/g, "");
}

const provinceNameByCode = new Map(
  provinceRows.map((item) => [item.code, normalizeProvinceLabel(item.name)])
);
const provinceMapNameByNormalized = new Map(
  provinceRows.map((item) => [normalizeProvinceLabel(item.name), item.name])
);

const aliasToProvince = new Map<string, string>();

provinceRows.forEach((province) => {
  const normalized = normalizeProvinceLabel(province.name);
  aliasToProvince.set(stripLocationNoise(province.name), normalized);
  aliasToProvince.set(stripLocationNoise(normalized), normalized);
});

cityRows.forEach((city) => {
  const provinceName = provinceNameByCode.get(city.provinceCode);
  if (!provinceName) return;

  const aliases = new Set([
    city.name,
    city.name.replace(/市$/g, ""),
    city.name.replace(/地区$/g, ""),
    city.name.replace(/盟$/g, "盟")
  ]);

  aliases.forEach((alias) => {
    const normalizedAlias = stripLocationNoise(alias);
    if (normalizedAlias) {
      aliasToProvince.set(normalizedAlias, provinceName);
    }
  });
});

areaRows.forEach((area) => {
  const provinceName = provinceNameByCode.get(area.provinceCode);
  if (!provinceName) return;

  const aliases = new Set([
    area.name,
    area.name.replace(/区$/g, ""),
    area.name.replace(/县$/g, ""),
    area.name.replace(/市$/g, "")
  ]);

  aliases.forEach((alias) => {
    const normalizedAlias = stripLocationNoise(alias);
    if (normalizedAlias) {
      aliasToProvince.set(normalizedAlias, provinceName);
    }
  });
});

export function resolveProvinceName(rawLocation: string) {
  const normalized = stripLocationNoise(normalizeText(rawLocation));
  if (!normalized) return "";

  if (aliasToProvince.has(normalized)) {
    return aliasToProvince.get(normalized) ?? "";
  }

  for (const [alias, province] of aliasToProvince.entries()) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return province;
    }
  }

  return "";
}

export function resolveProvinceMapName(rawProvinceName: string) {
  const normalized = normalizeProvinceLabel(normalizeText(rawProvinceName));
  return provinceMapNameByNormalized.get(normalized) ?? "";
}

export function buildProvinceDistribution(locations: string[]) {
  const countMap = new Map<string, number>();

  locations.forEach((location) => {
    const province = resolveProvinceName(location);
    if (!province) return;
    countMap.set(province, (countMap.get(province) ?? 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-CN"));
}
