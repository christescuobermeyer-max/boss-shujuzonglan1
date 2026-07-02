type DailyPointSummaryRow = {
  businessDateKey?: string;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function buildMonthlyPointSummary(rows: DailyPointSummaryRow[]) {
  const commissionShops = new Set<string>();
  const repaidShops = new Set<string>();
  const rowKeys = new Set<string>();
  const totalAmount = rows.reduce((sum, row) => {
    const platform = normalizeText(row.platform);
    const dateKey =
      normalizeText(row.businessDateKey) ||
      normalizeText(row.recordDateKey) ||
      normalizeText(row.recordDate);
    const shopKey =
      normalizeText(row.storeId) ||
      normalizeText(row.merchantId) ||
      normalizeText(row.shopName);
    const scopedShopKey = shopKey ? `${platform}|${shopKey}` : "";
    const rowKey = [
      platform,
      dateKey,
      normalizeText(row.merchantId),
      normalizeText(row.storeId),
      normalizeText(row.shopName),
      String(Number(row.amountValue ?? 0))
    ].join("|");

    if (scopedShopKey) {
      commissionShops.add(scopedShopKey);
      if (Number(row.amountValue ?? 0) > 0) {
        repaidShops.add(scopedShopKey);
      }
    }

    if (rowKeys.has(rowKey)) {
      return sum;
    }

    rowKeys.add(rowKey);
    return sum + Number(row.amountValue ?? 0);
  }, 0);

  return {
    commissionShopCount: commissionShops.size,
    repaidShopCount: repaidShops.size,
    totalAmount: Number(totalAmount.toFixed(2))
  };
}

