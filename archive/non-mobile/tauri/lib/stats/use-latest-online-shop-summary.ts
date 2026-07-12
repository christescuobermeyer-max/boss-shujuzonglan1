"use client";

import { useEffect, useState } from "react";
import type { LatestOnlineShopSummary } from "@/lib/stats/online-shop-latest";

const EMPTY_LATEST_ONLINE_SHOP_SUMMARY: LatestOnlineShopSummary = {
  latestDate: "",
  totalCount: 0,
  meituanCount: 0,
  elemeCount: 0
};

export function useLatestOnlineShopSummary() {
  const [latestOnlineShopSummary, setLatestOnlineShopSummary] =
    useState<LatestOnlineShopSummary>(EMPTY_LATEST_ONLINE_SHOP_SUMMARY);

  useEffect(() => {
    let active = true;

    const fetchLatestOnlineShopSummary = () => {
      fetch("/api/stats/latest-online-shop", { cache: "no-store" })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || "在线店铺数加载失败");
          }
          return result as LatestOnlineShopSummary;
        })
        .then((result) => {
          if (!active) return;
          setLatestOnlineShopSummary(result);
        })
        .catch(() => {
          if (!active) return;
          setLatestOnlineShopSummary(EMPTY_LATEST_ONLINE_SHOP_SUMMARY);
        });
    };

    fetchLatestOnlineShopSummary();
    const timer = window.setInterval(fetchLatestOnlineShopSummary, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return latestOnlineShopSummary;
}
