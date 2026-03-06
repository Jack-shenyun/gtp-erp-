import { promises as fs } from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { buildUploadFolderName, normalizeDepartmentForUpload } from "@shared/uploadPolicy";

function safeFileSegment(value: string): string {
  return String(value ?? "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getExtByMimeType(mimeType: string): string {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("word")) return ".docx";
  if (mime.includes("excel")) return ".xlsx";
  if (mime.includes("powerpoint")) return ".pptx";
  if (mime.includes("image/")) return ".png";
  if (mime.includes("text/")) return ".txt";
  return "";
}

export type SaveAttachmentInput = {
  department: string;
  businessFolder: string;
  originalName: string;
  desiredBaseName: string;
  mimeType?: string;
  buffer: Buffer;
};

export type SavedAttachment = {
  provider: "local" | "forge";
  filePath: string;
  storageKey: string;
  fileName: string;
};

export async function saveAttachmentFile(input: SaveAttachmentInput): Promise<SavedAttachment> {
  const departmentName = normalizeDepartmentForUpload(input.department, "销售部");
  const [department, businessFolder] = buildUploadFolderName(departmentName, input.businessFolder).map(safeFileSegment);
  const extFromName = path.extname(input.originalName || "").toLowerCase();
  const ext = extFromName || getExtByMimeType(String(input.mimeType || ""));
  const baseName = safeFileSegment(input.desiredBaseName || "附件");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${baseName}${ext}`;
  const relativeKey = ["uploads", department, businessFolder, uniqueName].join("/");
  const driver = String(ENV.fileStorageDriver || "local").toLowerCase();

  if (driver === "forge") {
    const uploaded = await storagePut(relativeKey, input.buffer, input.mimeType || "application/octet-stream");
    return {
      provider: "forge",
      filePath: uploaded.url,
      storageKey: uploaded.key,
      fileName: uniqueName,
    };
  }

  const root = ENV.fileStorageRoot
    ? path.resolve(ENV.fileStorageRoot)
    : path.resolve(process.cwd(), "uploads");
  const absDir = path.resolve(root, department, businessFolder);
  await fs.mkdir(absDir, { recursive: true });
  const absPath = path.resolve(absDir, uniqueName);
  await fs.writeFile(absPath, input.buffer);
  const webPath = `/uploads/${department}/${businessFolder}/${uniqueName}`;
  return {
    provider: "local",
    filePath: webPath,
    storageKey: relativeKey,
    fileName: uniqueName,
  };
}

