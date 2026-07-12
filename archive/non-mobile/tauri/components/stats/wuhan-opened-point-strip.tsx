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
  summaryWuhan,
  summaryYichang
}: {
  summaryWuhan: CityMonthlyPointSummary;
  summaryYichang: CityMonthlyPointSummary;
}) {
  const cohortShopCount = summaryWuhan.cohortShopCount + summaryYichang.cohortShopCount;

  return (
    <div className="wuhan-summary-strip-shell">
      <div className="wuhan-summary-strip">
        <article className="wuhan-summary-card wuhan-summary-card-label">
          <div className="wuhan-summary-card-head">
            <span className="wuhan-summary-eyebrow">武汉和宜昌回款数据</span>
          </div>
          <div className="wuhan-summary-card-body wuhan-summary-card-body-label">
            <strong className="wuhan-summary-title">武汉和宜昌累计开单本月回款</strong>
            <span className="wuhan-summary-note">
              共 {cohortShopCount} 家
              {` · 武汉 ${summaryWuhan.cohortShopCount} 家 · 宜昌 ${summaryYichang.cohortShopCount} 家`}
            </span>
          </div>
        </article>
        <MetricCard
          label="武汉抽点店铺数"
          value={<CountValue value={summaryWuhan.commissionShopCount} />}
          accentClass="wuhan-summary-card-teal"
        />
        <MetricCard
          label="宜昌抽点店铺数"
          value={<CountValue value={summaryYichang.commissionShopCount} />}
          accentClass="wuhan-summary-card-blue"
        />
        <MetricCard
          label="武汉回款金额"
          value={<AmountValue value={summaryWuhan.totalAmount} />}
          accentClass="wuhan-summary-card-gold"
        />
        <MetricCard
          label="宜昌回款金额"
          value={<AmountValue value={summaryYichang.totalAmount} />}
          accentClass="wuhan-summary-card-cyan"
        />
      </div>
    </div>
  );
}
