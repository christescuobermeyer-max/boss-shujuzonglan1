export type StatsDept = "all" | "wuhan" | "yichang";

export function normalizeStatsDept(value: string | null | undefined): StatsDept {
  if (value === "wuhan" || value === "yichang") {
    return value;
  }
  return "all";
}

export function getStatsDeptCity(dept: StatsDept) {
  if (dept === "wuhan") return "武汉";
  if (dept === "yichang") return "宜昌";
  return "";
}
