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
          <div className="recent-termination-table">
            <div className="recent-termination-table-header">
              <span>运营名称</span>
              <span>解约数</span>
              <span>总数</span>
              <span>解约率</span>
            </div>
            {rows.slice(0, 8).map((item) => (
              <div className="recent-termination-table-row" key={item.operatorName}>
                <span className="recent-termination-operator">{item.operatorName}</span>
                <strong>{item.count}家</strong>
                <span>{item.twoMonthSignedShopCount}家</span>
                <strong className="recent-termination-rate">
                  {formatRate(item.terminationRate)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="rank-empty">暂无新签解约数据</div>
        )}
      </div>
    </ChartPanel>
  );
}
