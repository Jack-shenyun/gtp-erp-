/**
 * 发票 AI 识别服务
 * 优先级：豆包（字节跳动）→ 通义千问（阿里）→ 智谱（清华）
 * 支持图片（JPG/PNG/WEBP/GIF）和 PDF（自动转图片）
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { OpenAI } from "openai";

// ==================== 配置 ====================

interface ProviderConfig {
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
  enabled: boolean;
}

function getProviders(): ProviderConfig[] {
  return [
    {
      name: "豆包",
      apiKey: process.env.DOUBAO_API_KEY || "1843f480-20a6-48d2-a9a5-8a4a188a3f32",
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
      model: "doubao-1.5-vision-pro-32k-250115",
      enabled: true,
    },
    {
      name: "通义千问",
      apiKey: process.env.QWEN_API_KEY || "",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-vl-max",
      enabled: !!(process.env.QWEN_API_KEY),
    },
    {
      name: "智谱",
      apiKey: process.env.ZHIPU_API_KEY || "b2427e1eaec24e1dbfc6b08c82e6d693.zc0XAEJ1g7iStgYY",
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-4v-flash",
      enabled: true,
    },
  ];
}

// ==================== 提示词 ====================

const INVOICE_PROMPT = `请识别这张发票图片，提取以下信息，以 JSON 格式返回：
{
  "invoiceNo": "发票号码",
  "invoiceDate": "YYYY-MM-DD",
  "sellerName": "销售方名称",
  "totalAmount": 含税总金额(数字),
  "taxAmount": 税额(数字),
  "amountExTax": 不含税金额(数字),
  "taxRate": 税率百分比(数字，如 13),
  "description": "货物或服务名称简述",
  "invoiceType": "vat_special(增值税专用) | vat_normal(增值税普通) | electronic(电子发票) | receipt(收据)"
}
如果某个字段无法识别，返回 null。只返回 JSON，不要其他文字。`;

// ==================== PDF 转图片 ====================

/**
 * 将 PDF base64 转为图片 base64 列表（每页一张）
 * 使用系统 pdftoppm（poppler-utils）
 */
export async function pdfBase64ToImageBase64List(pdfBase64: string): Promise<string[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "invoice-ocr-"));
  try {
    // 去掉 data:application/pdf;base64, 前缀
    const base64Data = pdfBase64.replace(/^data:[^;]+;base64,/, "");
    const pdfPath = path.join(tmpDir, "invoice.pdf");
    fs.writeFileSync(pdfPath, Buffer.from(base64Data, "base64"));

    // 用 pdftoppm 转为 PNG（每页一张，最多转前3页）
    const outputPrefix = path.join(tmpDir, "page");
    execSync(`pdftoppm -png -r 150 -l 3 "${pdfPath}" "${outputPrefix}"`, { timeout: 30000 });

    // 读取生成的图片文件
    const files = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith("page") && f.endsWith(".png"))
      .sort();

    return files.map(f => {
      const imgBuffer = fs.readFileSync(path.join(tmpDir, f));
      return `data:image/png;base64,${imgBuffer.toString("base64")}`;
    });
  } finally {
    // 清理临时文件
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ==================== 单个 provider 识别 ====================

async function recognizeWithProvider(
  provider: ProviderConfig,
  imageBase64: string
): Promise<Record<string, any>> {
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });

  const response = await client.chat.completions.create({
    model: provider.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: INVOICE_PROMPT },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ],
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("模型未返回有效 JSON");
  return JSON.parse(jsonMatch[0]);
}

// ==================== 三家轮询 ====================

async function recognizeWithFallback(imageBase64: string): Promise<{
  data: Record<string, any>;
  provider: string;
  error?: string;
}> {
  const providers = getProviders().filter(p => p.enabled);

  if (providers.length === 0) {
    throw new Error("未配置任何 AI 识别服务，请设置 DOUBAO_API_KEY 等环境变量");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const data = await recognizeWithProvider(provider, imageBase64);
      return { data, provider: provider.name };
    } catch (err: any) {
      const msg = `${provider.name} 识别失败: ${err.message}`;
      errors.push(msg);
      console.warn(`[InvoiceOCR] ${msg}`);
    }
  }

  throw new Error(`所有 AI 服务均识别失败：${errors.join(" | ")}`);
}

// ==================== 主入口 ====================

export interface OcrInput {
  name: string;
  base64: string; // data:image/...;base64,... 或 data:application/pdf;base64,...
}

export interface OcrResult {
  name: string;
  success: boolean;
  provider?: string;
  data: Record<string, any>;
  error?: string;
}

export async function recognizeInvoices(inputs: OcrInput[]): Promise<OcrResult[]> {
  const results: OcrResult[] = [];

  for (const input of inputs) {
    try {
      const isPdf = input.base64.startsWith("data:application/pdf") ||
                    input.name.toLowerCase().endsWith(".pdf");

      let imageBase64List: string[];

      if (isPdf) {
        // PDF 转图片，取第一页识别（通常发票只有一页）
        imageBase64List = await pdfBase64ToImageBase64List(input.base64);
        if (imageBase64List.length === 0) {
          throw new Error("PDF 转图片失败，未生成任何页面");
        }
      } else {
        imageBase64List = [input.base64];
      }

      // 识别第一张图（发票通常只有一页）
      const { data, provider } = await recognizeWithFallback(imageBase64List[0]);

      results.push({
        name: input.name,
        success: true,
        provider,
        data,
      });
    } catch (err: any) {
      results.push({
        name: input.name,
        success: false,
        error: err.message,
        data: {},
      });
    }
  }

  return results;
}
