export const DEPARTMENT_NAMES = [
  "管理部",
  "招商部",
  "销售部",
  "研发部",
  "生产部",
  "质量部",
  "采购部",
  "仓库管理",
  "财务部",
] as const;

export const DEPARTMENT_OPTIONS = DEPARTMENT_NAMES.map((name) => ({
  label: name,
  value: name,
}));

export const DEPARTMENT_NAMES_WITH_ALL = ["全部门", ...DEPARTMENT_NAMES] as const;

const LEGACY_DEPARTMENT_MAP: Record<string, string> = {
  "质量管理部": "质量部",
  "仓库管理部": "仓库管理",
  "财务管理": "财务部",
  "仓储部": "仓库管理",
};

export function normalizeDepartmentName(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  return LEGACY_DEPARTMENT_MAP[value] ?? value;
}

export function parseDepartmentList(raw: unknown): string[] {
  const value = String(raw ?? "").trim();
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[\uFF0C,;；/、|\s]+/)
        .map((item) => normalizeDepartmentName(item))
        .filter(Boolean),
    ),
  );
}

export function stringifyDepartmentList(values: string[]): string {
  return Array.from(new Set(values.map((item) => normalizeDepartmentName(item)).filter(Boolean))).join("，");
}
