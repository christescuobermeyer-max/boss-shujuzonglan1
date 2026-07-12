import { resolveShopOpenedDate } from "@/lib/stats/shop-opened-date";

type ShopWithOpenedDate = {
  contractSignedDate?: Date | string;
  entryDate?: Date | string;
  merchantId?: string;
  shopName?: string;
};

export function buildMonthlyShopCohorts<T extends ShopWithOpenedDate>(params: {
  start: Date;
  end: Date;
  shops: T[];
}) {
  const cumulativeShops = params.shops.filter((shop) => {
    const openedDate = resolveShopOpenedDate(shop);
    if (!openedDate) return false;
    return openedDate < params.end;
  });

  const monthlyShops = cumulativeShops.filter((shop) => {
    const openedDate = resolveShopOpenedDate(shop);
    if (!openedDate) return false;
    return openedDate >= params.start && openedDate < params.end;
  });

  return {
    monthlyShops,
    cumulativeShops
  };
}
