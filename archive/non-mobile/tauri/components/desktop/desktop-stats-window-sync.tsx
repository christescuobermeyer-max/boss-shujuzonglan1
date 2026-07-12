"use client";

import { useEffect } from "react";
import { promoteDashboardWindow } from "@/lib/desktop-window";

export function DesktopStatsWindowSync() {
  useEffect(() => {
    promoteDashboardWindow().catch(() => undefined);
  }, []);

  return null;
}
