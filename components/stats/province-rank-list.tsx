import type { ProvinceValueItem } from "@/lib/stats/types";
import { formatTopRankLabel } from "@/lib/stats/rank-label";

export function ProvinceRankList({
  items,
  activeProvince,
  onHoverProvince
}: {
  items: ProvinceValueItem[];
  activeProvince?: string | null;
  onHoverProvince: (provinceName: string | null) => void;
}) {
  return (
    <>
      <div className="subrank-title">开单量 TOP 省份</div>
      <div className="province-mini-grid">
        {items.map((item, index) => (
          <button
            type="button"
            className={`province-mini-item${activeProvince === item.name ? " active" : ""}`}
            key={`${item.name}-${index}`}
            onMouseEnter={() => onHoverProvince(item.name)}
            onMouseLeave={() => onHoverProvince(null)}
            onFocus={() => onHoverProvince(item.name)}
            onBlur={() => onHoverProvince(null)}
          >
            <span className="province-mini-rank">{formatTopRankLabel(index + 1)}</span>
            <span className="province-mini-name">{item.name}</span>
            <span className="province-mini-value">{item.value}</span>
          </button>
        ))}
      </div>
    </>
  );
}
