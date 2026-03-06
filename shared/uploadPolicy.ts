export const ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
] as const;

export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.join(",");

const LEGACY_DEPARTMENT_MAP: Record<string, string> = {
  "质量管理部": "质量部",
  "仓库管理部": "仓库管理",
  "财务管理": "财务部",
  "仓储部": "仓库管理",
};

const KNOWN_DEPARTMENTS = new Set([
  "管理部",
  "招商部",
  "销售部",
  "研发部",
  "生产部",
  "质量部",
  "采购部",
  "仓库管理",
  "财务部",
  "系统设置",
]);

export function normalizeDepartmentForUpload(raw: unknown, fallback = "销售部"): string {
  const value = String(raw ?? "").trim();
  if (!value) return fallback;
  const normalized = LEGACY_DEPARTMENT_MAP[value] ?? value;
  return KNOWN_DEPARTMENTS.has(normalized) ? normalized : normalized;
}

export function buildUploadFolderName(rawDepartment: unknown, businessFolder: string): string[] {
  const department = normalizeDepartmentForUpload(rawDepartment);
  const folder = String(businessFolder ?? "").trim() || "附件";
  return [department, folder];
}

