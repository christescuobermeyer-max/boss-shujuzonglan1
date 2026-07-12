export function buildMonthDateKeys(start: Date, end: Date) {
  const keys: string[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cursor.getUTCDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}
