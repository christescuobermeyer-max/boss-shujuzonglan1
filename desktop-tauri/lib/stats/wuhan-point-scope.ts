const WUHAN_MONTHLY_POINT_MIN_DATE = new Date("2026-03-01T00:00:00+08:00");

export function isInWuhanMonthlyPointCohort(date: Date, monthEnd: Date) {
  return date >= WUHAN_MONTHLY_POINT_MIN_DATE && date < monthEnd;
}
