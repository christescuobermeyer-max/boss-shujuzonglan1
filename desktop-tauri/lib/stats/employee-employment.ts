import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";

type EmployeeRole = "sales" | "operator";
type EmploymentStatus = "在职" | "离职" | "";

type EmployeeStatusRow = {
  operatorEmploymentStatus?: string;
  operatorName?: string;
  salesEmploymentStatus?: string;
  salesName?: string;
};

function normalizeStatus(value: unknown): EmploymentStatus {
  const status = String(value ?? "").trim();
  return status === "在职" || status === "离职" ? status : "";
}

function pickEmployeeName(row: EmployeeStatusRow, role: EmployeeRole) {
  return String(role === "sales" ? row.salesName : row.operatorName).trim();
}

function pickEmployeeStatus(row: EmployeeStatusRow, role: EmployeeRole) {
  return normalizeStatus(role === "sales" ? row.salesEmploymentStatus : row.operatorEmploymentStatus);
}

export function buildEmployeeStatusMap(rows: EmployeeStatusRow[], role: EmployeeRole) {
  const statusMap = new Map<string, Set<EmploymentStatus>>();

  rows.forEach((row) => {
    const name = pickEmployeeName(row, role);
    const status = pickEmployeeStatus(row, role);
    if (!name || !status) return;
    if (!statusMap.has(name)) {
      statusMap.set(name, new Set<EmploymentStatus>());
    }
    statusMap.get(name)!.add(status);
  });

  return new Map(
    Array.from(statusMap.entries()).map(([name, statuses]) => [
      name,
      statuses.has("在职") ? "在职" : "离职",
    ])
  );
}

export function filterActiveNamedItems<T>(
  items: T[],
  statusMap: Map<string, string>,
  pickName: (item: T) => string
) {
  return items.filter((item) => statusMap.get(String(pickName(item)).trim()) === "在职");
}

export function filterActiveDailyTrendSeries(
  items: DailyTrendSeries[],
  statusMap: Map<string, string>
) {
  return items.filter((item) => {
    const name = String(item.name ?? "").trim();
    return name === "未分配" || statusMap.get(name) === "在职";
  });
}
