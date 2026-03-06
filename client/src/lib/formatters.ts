export function toSafeNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function formatNumber(value: unknown, locale = "zh-CN"): string {
  return toSafeNumber(value).toLocaleString(locale);
}

export function safeLower(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

export function formatDateValue(value: unknown, includeTime = false): string {
  if (value == null || value === "") return "-";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "-";
    return includeTime ? value.toLocaleString("zh-CN") : value.toLocaleDateString("zh-CN");
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return includeTime ? date.toLocaleString("zh-CN") : date.toLocaleDateString("zh-CN");
    }
    return String(value);
  }

  return String(value);
}
