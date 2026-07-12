"use client";

function formatMonthLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return value;
  return `${matched[1]}年${Number(matched[2])}月`;
}

export function DashboardHeader({
  month,
  latestMonth,
  updateTime,
  onChangeMonth,
  onPrevMonth,
  onNextMonth
}: {
  month: string;
  latestMonth: string;
  updateTime: string;
  onChangeMonth: (nextMonth: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <section className="hero-card hero-header">
      <div className="brand-row">
        <div className="brand-mark">
          <svg width="30" height="30" viewBox="0 0 44 44" fill="none">
            <rect x="4" y="30" width="10" height="10" rx="2" fill="#C3D8FF" />
            <rect x="17" y="21" width="10" height="19" rx="2" fill="#93BBFF" />
            <rect x="30" y="10" width="10" height="30" rx="2" fill="#1677FF" />
            <path d="M32 6L38 12M32 6L26 12" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="eyebrow">呈尚策划 · 月度数据总览 · BOSS看板</div>
          <div className="brand-title-row">
            <h1>代运营数据统计中心</h1>
            <span className="brand-subtitle">数据统计系统</span>
          </div>
          <p>按月查看店铺、回款、解约与省份热力分布。</p>
        </div>
      </div>

      <div className="toolbar-stack">
        <div className="toolbar-card">
          <div className="toolbar-heading">
            <span className="toolbar-label">统计月份</span>
            <div className="update-status">
              <span className="update-dot" />
              <span>{updateTime}</span>
            </div>
          </div>
          <div className="month-nav">
            <button type="button" className="month-nav-btn" onClick={onPrevMonth}>
              ‹
            </button>
            <label className="month-input-shell">
              <span className="month-display">{formatMonthLabel(month)}</span>
              <input
                type="month"
                value={month}
                max={latestMonth}
                onChange={(event) => onChangeMonth(event.target.value)}
              />
            </label>
            <button type="button" className="month-nav-btn" onClick={onNextMonth}>
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
