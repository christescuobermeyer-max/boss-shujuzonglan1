import { DesktopAuthGuard } from "@/components/desktop/desktop-auth-guard";
import { DesktopStatsWindowSync } from "@/components/desktop/desktop-stats-window-sync";
import { MonthlyStatsDashboard } from "@/components/stats/monthly-stats-dashboard";

export default function StatsPage() {
  return (
    <DesktopAuthGuard>
      <DesktopStatsWindowSync />
      <MonthlyStatsDashboard />
    </DesktopAuthGuard>
  );
}
