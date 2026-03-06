export const PAYMENT_CONDITIONS = [
  "预付款",
  "先款后货",
  "货到付款",
  "账期支付",
] as const;

export type PaymentCondition = (typeof PAYMENT_CONDITIONS)[number];

export const PAYMENT_CONDITION_OPTIONS = PAYMENT_CONDITIONS.map((value) => ({
  label: value,
  value,
}));

export function normalizePaymentCondition(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if ((PAYMENT_CONDITIONS as readonly string[]).includes(value)) return value;

  const lower = value.toLowerCase();

  if (
    value.includes("预付") ||
    lower.includes("deposit")
  ) {
    return "预付款";
  }

  if (
    value.includes("货到付款") ||
    value.includes("到付") ||
    lower.includes("cod")
  ) {
    return "货到付款";
  }

  if (
    value.includes("现结") ||
    value.includes("现款") ||
    value.includes("先款") ||
    value.includes("款到发货") ||
    lower.includes("cash")
  ) {
    return "先款后货";
  }

  if (
    value.includes("月结") ||
    value.includes("账期") ||
    value.includes("赊") ||
    lower.includes("credit") ||
    lower.includes("net")
  ) {
    return "账期支付";
  }

  return value;
}

export function isAccountPeriodPaymentCondition(raw: unknown): boolean {
  return normalizePaymentCondition(raw) === "账期支付";
}

export function needsCreditLimitForPaymentCondition(raw: unknown): boolean {
  return normalizePaymentCondition(raw) === "账期支付";
}
