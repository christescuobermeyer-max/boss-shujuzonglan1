import { resolveDailyPointBusinessDateKey } from "@/lib/stats/daily-point-business-date";

type DailyPointScopeRow = {
  amountValue?: number;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  rowData?: Record<string, unknown>;
};

type ScopedDailyPointRow<T> = T & {
  businessDateKey: string;
};

function buildMonthRange(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    startKey: `${matched[1]}-${matched[2]}-01`,
    endKey: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-01`
  };
}

export function filterDetailsByBusinessMonth<T extends DailyPointScopeRow>(params: {
  month: string;
  details: T[];
}) {
  const range = buildMonthRange(params.month);
  if (!range) return [] as Array<ScopedDailyPointRow<T>>;

  return params.details
    .map((detail) => ({
      ...detail,
      businessDateKey: resolveDailyPointBusinessDateKey(detail)
    }))
    .filter(
      (detail) =>
        Boolean(detail.businessDateKey) &&
        detail.businessDateKey >= range.startKey &&
        detail.businessDateKey < range.endKey
    );
}
