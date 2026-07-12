import type { ReactNode } from "react";
import type { CityMonthlyPointSummary } from "@/lib/stats/types";

function formatAmountParts(value: number) {
  const [integer, decimal = "00"] = value
    .toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    .split(".");

  return { integer, decimal };
}

function CountValue({ value }: { value: number }) {
  return (
    <div className="wuhan-summary-value">
      <span className="wuhan-summary-value-number">{value}</span>
      <span className="wuhan-summary-value-unit">家</span>
    </div>
  );
}

function AmountValue({ value }: { value: number }) {
  const parts = formatAmountParts(value);

  return (
    <div className="wuhan-summary-value">
      <span className="wuhan-summary-value-currency">¥</span>
      <span className="wuhan-summary-value-number">{parts.integer}</span>
      <span className="wuhan-summary-value-decimal">.{parts.decimal}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accentClass
}: {
  label: string;
  value: ReactNode;
  accentClass: string;
}) {
  return (
    <article className={`wuhan-summary-card ${accentClass}`}>
      <div className="wuhan-summary-card-head">
        <span className="wuhan-summary-label">{label}</span>
      </div>
      <div className="wuhan-summary-card-body">{value}</div>
    </article>
  );
}

export function WuhanOpenedPointStrip({
  summary
}: {
  summary: CityMonthlyPointSummary;
}) {
  return (
    <div className="wuhan-summary-strip-shell">
      <div className="wuhan-summary-strip">
        <article className="wuhan-summary-card wuhan-summary-card-label">
          <div className="wuhan-summary-card-head">
            <span className="wuhan-summary-eyebrow">武汉回款数据</span>
          </div>
          <div className="wuhan-summary-card-body wuhan-summary-card-body-label">
            <strong className="wuhan-summary-title">累计开单本月回款</strong>
            <span className="wuhan-summary-note">{summary.cohortShopCount} 家累计开单门店纳入统计</span>
          </div>
        </article>
        <MetricCard
          label="抽点店铺数"
          value={<CountValue value={summary.commissionShopCount} />}
          accentClass="wuhan-summary-card-teal"
        />
        <MetricCard
          label="总回款金额"
          value={<AmountValue value={summary.totalAmount} />}
          accentClass="wuhan-summary-card-blue"
        />
        <MetricCard
          label="美团回款金额"
          value={<AmountValue value={summary.meituanAmount} />}
          accentClass="wuhan-summary-card-gold"
        />
        <MetricCard
          label="饿了么回款金额"
          value={<AmountValue value={summary.elemeAmount} />}
          accentClass="wuhan-summary-card-cyan"
        />
      </div>
    </div>
  );
}
