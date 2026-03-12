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
import { createPrintContext, executePrint } from "@/lib/printEngine";

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
    const saved = savedTemplates?.find(t => t.templateKey === templateKey);
    // 2. 获取默认模版定义
    const def = getTemplateDefinition(templateKey);
    
    if (!saved && !def) {
      console.error(`未找到模版定义：${templateKey}`);
      return;
    }

    // 3. 确定使用的 HTML 和 CSS
    const htmlContent = saved?.htmlContent || def?.defaultHtml || "";
    const cssContent = saved?.cssContent || def?.defaultCss || "";
    const paperSize = saved?.paperSize || "A4";
    const orientation = saved?.orientation || "portrait";
    const marginTop = saved?.marginTop ?? 20;
    const marginRight = saved?.marginRight ?? 20;
    const marginBottom = saved?.marginBottom ?? 20;
    const marginLeft = saved?.marginLeft ?? 20;

    // 4. 创建打印上下文
    const ctx = createPrintContext(companyInfo || {}, data);

    // 5. 执行打印（与预览使用完全相同的渲染逻辑）
    executePrint({
      htmlContent,
      cssContent,
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
