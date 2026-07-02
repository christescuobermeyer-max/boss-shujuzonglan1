function parseMonth(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    throw new Error(`无效月份: ${month}`);
  }

  return {
    year: Number(matched[1]),
    month: Number(matched[2])
  };
}

export function shiftMonthValue(month: string, delta: number) {
  const parsed = parseMonth(month);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildRecentMonthOptions(currentMonth: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    shiftMonthValue(currentMonth, -index)
  );
}

export function getNextRotationMonth(months: string[], currentMonth: string) {
  const currentIndex = months.indexOf(currentMonth);
  if (currentIndex === -1 || months.length === 0) {
    return months[0] ?? currentMonth;
  }

  return months[(currentIndex + 1) % months.length];
}

export function getPreviousMonthValue(month: string) {
  return shiftMonthValue(month, -1);
}

export function getNextAllowedMonth(month: string, latestMonth: string) {
  const nextMonth = shiftMonthValue(month, 1);
  return nextMonth > latestMonth ? latestMonth : nextMonth;
}

