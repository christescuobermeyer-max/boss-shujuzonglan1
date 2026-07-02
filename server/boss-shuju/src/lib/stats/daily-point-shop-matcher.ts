import { normalizeText } from "../daily-point-derived.js";

type ShopMatchRow = {
  merchantId?: string;
  shopName?: string;
  operatorName?: string;
  deliveryPlatform?: string;
};

type DetailMatchRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
};

function buildIndexKey(platform: string, value: string) {
  return `${platform}|${value}`;
}

export function resolveDailyPointPlatform(deliveryPlatform: unknown) {
  return normalizeText(deliveryPlatform).includes("饿了么") ? "eleme" : "meituan";
}

export function buildDailyPointShopMatcher(shops: ShopMatchRow[]) {
  const merchantKeys = new Set<string>();
  const shopNameKeys = new Set<string>();
  const merchantToOperator = new Map<string, string>();
  const shopNameToOperator = new Map<string, string>();

  shops.forEach((shop) => {
    const platform = resolveDailyPointPlatform(shop.deliveryPlatform);
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    const operatorName = normalizeText(shop.operatorName) || "未分配";

    if (merchantId) {
      const key = buildIndexKey(platform, merchantId);
      merchantKeys.add(key);
      merchantToOperator.set(key, operatorName);
    }

    if (shopName) {
      const key = buildIndexKey(platform, shopName);
      shopNameKeys.add(key);
      shopNameToOperator.set(key, operatorName);
    }
  });

  function resolveOperator(detail: DetailMatchRow) {
    const platform = normalizeText(detail.platform);
    const merchantId = normalizeText(detail.merchantId);
    const storeId = normalizeText(detail.storeId);
    const shopName = normalizeText(detail.shopName);

    return (
      merchantToOperator.get(buildIndexKey(platform, merchantId)) ||
      merchantToOperator.get(buildIndexKey(platform, storeId)) ||
      shopNameToOperator.get(buildIndexKey(platform, shopName)) ||
      "未分配"
    );
  }

  function matches(detail: DetailMatchRow) {
    const platform = normalizeText(detail.platform);
    const merchantId = normalizeText(detail.merchantId);
    const storeId = normalizeText(detail.storeId);
    const shopName = normalizeText(detail.shopName);

    return (
      merchantKeys.has(buildIndexKey(platform, merchantId)) ||
      merchantKeys.has(buildIndexKey(platform, storeId)) ||
      shopNameKeys.has(buildIndexKey(platform, shopName))
    );
  }

  return {
    matches,
    resolveOperator
  };
}

