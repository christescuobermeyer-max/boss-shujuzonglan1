export type WorkflowOperatorStat = {
  operatorName: string;
  pendingShopCount: number;
  flowPendingShopCount: number;
  patrolPendingShopCount: number;
};

export type WorkflowDailyMonitorPayload = {
  operatorStats: WorkflowOperatorStat[];
  totalPendingShops: number;
  generatedAt: string;
};

export type AftersalesRecord = {
  shopName: string;
  merchantId: string;
  deliveryPlatform: string;
  shopStatus: string;
  actionType: string;
  actionLabel: string;
  operatorName: string;
  note: string;
  rechargeAmount?: number;
  conversionRate30d?: number;
  createdAt: string;
};

export type AftersalesEmployee = {
  operatorName: string;
  actionCount: number;
  shopCount: number;
  records: AftersalesRecord[];
};

export type AftersalesDailyRecordsPayload = {
  dateKey: string;
  totalCount: number;
  employees: AftersalesEmployee[];
  generatedAt: string;
};

function normalizeName(value: unknown) {
  const name = String(value ?? "").trim();
  return name || "未分配";
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getShanghaiDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return { year, month, day };
}

export function getShanghaiDateKey(date = new Date()) {
  const { year, month, day } = getShanghaiDateParts(date);
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

export function getDefaultAftersalesDateKey(now = new Date()) {
  const { year, month, day } = getShanghaiDateParts(now);
  if (!year || !month || !day) return "";

  const shanghaiMidnightUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    -8
  );
  return getShanghaiDateKey(new Date(shanghaiMidnightUtc - 24 * 60 * 60 * 1000));
}

export function buildEmptyWorkflowDailyMonitor(): WorkflowDailyMonitorPayload {
  return {
    operatorStats: [],
    totalPendingShops: 0,
    generatedAt: ""
  };
}

export function buildEmptyAftersalesDailyRecords(): AftersalesDailyRecordsPayload {
  return {
    dateKey: "",
    totalCount: 0,
    employees: [],
    generatedAt: ""
  };
}

export function buildWorkflowProgressRows(
  payload: WorkflowDailyMonitorPayload,
  limit = 8
) {
  return [...(payload.operatorStats ?? [])]
    .map((item) => ({
      operatorName: normalizeName(item.operatorName),
      pendingShopCount: toFiniteNumber(item.pendingShopCount),
      flowPendingShopCount: toFiniteNumber(item.flowPendingShopCount),
      patrolPendingShopCount: toFiniteNumber(item.patrolPendingShopCount)
    }))
    .sort(
      (left, right) =>
        right.pendingShopCount - left.pendingShopCount ||
        left.operatorName.localeCompare(right.operatorName, "zh-CN")
    )
    .slice(0, limit);
}

export function buildAftersalesEmployeeRows(
  payload: AftersalesDailyRecordsPayload,
  limit = 6
) {
  return [...(payload.employees ?? [])]
    .map((item) => ({
      operatorName: normalizeName(item.operatorName),
      actionCount: toFiniteNumber(item.actionCount),
      shopCount: toFiniteNumber(item.shopCount),
      records: item.records ?? []
    }))
    .sort(
      (left, right) =>
        right.actionCount - left.actionCount ||
        right.shopCount - left.shopCount ||
        left.operatorName.localeCompare(right.operatorName, "zh-CN")
    )
    .slice(0, limit);
}

export function getRecentAftersalesRecords(
  payload: AftersalesDailyRecordsPayload,
  limit = 8
) {
  return (payload.employees ?? [])
    .flatMap((employee) =>
      (employee.records ?? []).map((record) => ({
        ...record,
        operatorName: normalizeName(record.operatorName || employee.operatorName)
      }))
    )
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt ?? "").getTime();
      const rightTime = new Date(right.createdAt ?? "").getTime();
      return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
    })
    .slice(0, limit);
}

export function formatOpenApiDateTime(value: string) {
  if (!value) return "暂无更新时间";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "暂无更新时间";

  return `${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  }).format(parsed)} 更新`;
}
