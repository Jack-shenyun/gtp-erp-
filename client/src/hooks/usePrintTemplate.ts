/**
 * usePrintTemplate Hook
 * 
 * 统一的打印模版调用 Hook，各业务页面通过此 Hook 执行打印
 * 自动从后端加载自定义模版，若无自定义则使用默认模版
 * 确保所见即所得：使用与设置页面完全相同的渲染引擎
 */
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getTemplateDefinition } from "@/lib/printTemplateDefaults";
import {
  createPrintContext,
  executePrint,
  resolveTemplateHtml,
  spreadsheetToRenderableHtml,
} from "@/lib/printEngine";
import { getDefaultSpreadsheetData } from "@/pages/settings/PrintTemplates";

export function usePrintTemplate() {
  // 获取公司信息
  const { data: companyInfo } = trpc.companyInfo.get.useQuery();
  // 获取所有已保存的自定义模版
  const { data: savedTemplates } = trpc.printTemplates.list.useQuery();

  /**
   * 执行打印
   * @param templateKey 模版标识，如 "sales_order"
   * @param data 业务数据对象
   */
  const print = useCallback((templateKey: string, data: Record<string, any>) => {
    // 1. 查找自定义模版
    const saved = savedTemplates?.find((t: any) => t.templateKey === templateKey);
    // 2. 获取默认模版定义
    const def = getTemplateDefinition(templateKey);
    
    if (!saved && !def) {
      console.error(`未找到模版定义：${templateKey}`);
      return;
    }

    let htmlContent: string;
    let paperSize = "A4";
    let orientation = "portrait";
    let marginTop = 15;
    let marginRight = 10;
    let marginBottom = 15;
    let marginLeft = 10;

    if (saved?.htmlContent) {
      // 有自定义模版 — 可能是 SpreadsheetData JSON 或旧的 HTML
      const resolved = resolveTemplateHtml(saved.htmlContent);
      htmlContent = resolved.html;
      paperSize = resolved.paperSize || saved.paperSize || "A4";
      orientation = resolved.orientation || saved.orientation || "portrait";
      marginTop = resolved.marginTop ?? saved.marginTop ?? 15;
      marginRight = resolved.marginRight ?? saved.marginRight ?? 10;
      marginBottom = resolved.marginBottom ?? saved.marginBottom ?? 15;
      marginLeft = resolved.marginLeft ?? saved.marginLeft ?? 10;
    } else {
      // 没有自定义模版 — 使用默认的 SpreadsheetData
      const defaultData = getDefaultSpreadsheetData(templateKey);
      htmlContent = spreadsheetToRenderableHtml(defaultData);
      paperSize = defaultData.paperSize;
      orientation = defaultData.orientation;
      marginTop = defaultData.marginTop;
      marginRight = defaultData.marginRight;
      marginBottom = defaultData.marginBottom;
      marginLeft = defaultData.marginLeft;
    }

    // 3. 创建打印上下文
    const ctx = createPrintContext(companyInfo || {}, data);

    // 4. 执行打印（与预览使用完全相同的渲染逻辑）
    executePrint({
      htmlContent,
      cssContent: "",
      context: ctx,
      paperSize,
      orientation,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    });
  }, [companyInfo, savedTemplates]);

  return { print };
}
