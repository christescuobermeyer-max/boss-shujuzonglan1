function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMonthRecordDateRegex(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    return new RegExp(`^${escapeRegex(month)}`);
  }

  const year = matched[1];
  const monthNoPad = String(Number(matched[2]));
  return new RegExp(`^${year}(?:[-/年\\s]+)0?${monthNoPad}(?:月|[-/\\s]|$)`);
}

export function resolveMonthRange(month: string | null) {
  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      return { start, end, month: month.slice(0, 7) };
    }
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start,
    end,
    month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`
  };
}
