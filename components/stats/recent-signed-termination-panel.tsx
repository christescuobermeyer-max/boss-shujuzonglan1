import { ChartPanel } from "@/components/stats/chart-panel";
import type { RecentSignedTerminationStatsResponse } from "@/lib/stats/recent-signed-termination-types";

function formatRate(value: number) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

export function RecentSignedTerminationPanel({
  data,
  loading,
  error
}: {
  data: RecentSignedTerminationStatsResponse | null;
  loading: boolean;
  error: string;
}) {
  const rows = data?.operatorStats ?? [];

  return (
    <ChartPanel
      title="新签解约运营汇总"
      subtitle={
        data
          ? `${data.twoMonthSignedRange.startMonth}-${data.twoMonthSignedRange.endMonth} 签约，本月解约`
          : "上月 + 本月签约店铺中的本月解约情况"
      }
    >
      {error ? <div className="mini-error">{error}</div> : null}
      <div className="recent-termination-summary">
        <div>
          <span>解约数量</span>
          <strong>{loading ? "..." : data?.totalTerminatedCount ?? 0}</strong>
        </div>
        <div>
          <span>两个月总数</span>
          <strong>{loading ? "..." : data?.twoMonthSignedShopCount ?? 0}</strong>
        </div>
        <div>
          <span>运营人数</span>
          <strong>{loading ? "..." : data?.operatorCount ?? 0}</strong>
        </div>
      </div>
      <div className="recent-termination-list">
        {loading ? (
          <div className="rank-empty">加载中...</div>
        ) : rows.length ? (
          rows.slice(0, 8).map((item, index) => (
            <div className="recent-termination-row" key={item.operatorName}>
              <div className="recent-termination-rank">{index + 1}</div>
              <div className="recent-termination-name">{item.operatorName}</div>
              <div className="recent-termination-metrics">
                <strong>{item.count}家</strong>
                <span>两个月总数 {item.twoMonthSignedShopCount}</span>
                <span>解约率 {formatRate(item.terminationRate)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rank-empty">暂无新签解约数据</div>
        )}
      </div>
    </ChartPanel>
  );
}
