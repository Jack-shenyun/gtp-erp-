/**
 * 批量创建产品脚本
 * 创建：3个原材料、2个半成品、3个辅料
 */
import { createProduct, getNextProductCode } from "../server/db";

const DEFAULT_MANUFACTURER = "苏州神韵医疗器械有限公司";

async function main() {
  console.log("开始批量创建产品...\n");

  // ===== 3个原材料（YCL前缀）=====
  const rawMaterials = [
    {
      name: "医用级硅胶原料",
      specification: "硬度Shore A 50°，透明",
      category: "oem",
      description: "用于生产医用硅胶管的基础原材料，符合ISO 10993生物相容性标准",
    },
    {
      name: "医用聚氨酯颗粒",
      specification: "粒径3-5mm，白色",
      category: "oem",
      description: "热塑性聚氨酯弹性体，用于医用导管挤出成型",
    },
    {
      name: "医用不锈钢丝",
      specification: "直径0.3mm，316L不锈钢",
      category: "oem",
      description: "用于医用导管加强层编织，耐腐蚀性强",
    },
  ];

  // ===== 2个半成品（BCP前缀）=====
  const semiFinished = [
    {
      name: "硅胶管坯料",
      specification: "内径4mm×外径6mm，未裁切",
      category: "oem",
      description: "经挤出成型的硅胶管半成品，待后续裁切和表面处理",
    },
    {
      name: "导管编织体",
      specification: "内径3mm，三层编织结构",
      category: "oem",
      description: "完成编织工序的导管中间体，待灌胶和端头处理",
    },
  ];

  // ===== 3个辅料（FL前缀）=====
  const auxiliary = [
    {
      name: "医用环氧乙烷灭菌袋",
      specification: "150mm×250mm，透析纸/PE复合膜",
      category: "oem",
      description: "用于医疗器械EO灭菌包装，符合YY/T 0698标准",
    },
    {
      name: "医用润滑剂",
      specification: "500ml/瓶，水溶性",
      category: "oem",
      description: "用于导管生产过程中的润滑处理，生物相容性好",
    },
    {
      name: "产品标签纸",
      specification: "60mm×40mm，热敏不干胶",
      category: "oem",
      description: "用于产品包装标签打印，耐高温灭菌处理",
    },
  ];

  let successCount = 0;
  let failCount = 0;

  // 创建原材料
  console.log("=== 创建原材料（YCL）===");
  for (const item of rawMaterials) {
    try {
      const nextCode = await getNextProductCode("YCL");
      const product = await createProduct({
        isMedicalDevice: false,
        code: nextCode,
        name: item.name,
        specification: item.specification,
        category: item.category,
        productCategory: "raw_material",
        status: "active",
        manufacturer: DEFAULT_MANUFACTURER,
        description: item.description,
      });
      console.log(`✓ 创建成功: ${nextCode} - ${item.name}`);
      successCount++;
    } catch (err: any) {
      console.error(`✗ 创建失败: ${item.name} - ${err.message}`);
      failCount++;
    }
  }

  // 创建半成品
  console.log("\n=== 创建半成品（BCP）===");
  for (const item of semiFinished) {
    try {
      const nextCode = await getNextProductCode("BCP");
      const product = await createProduct({
        isMedicalDevice: false,
        code: nextCode,
        name: item.name,
        specification: item.specification,
        category: item.category,
        productCategory: "semi_finished",
        status: "active",
        manufacturer: DEFAULT_MANUFACTURER,
        description: item.description,
      });
      console.log(`✓ 创建成功: ${nextCode} - ${item.name}`);
      successCount++;
    } catch (err: any) {
      console.error(`✗ 创建失败: ${item.name} - ${err.message}`);
      failCount++;
    }
  }

  // 创建辅料
  console.log("\n=== 创建辅料（FL）===");
  for (const item of auxiliary) {
    try {
      const nextCode = await getNextProductCode("FL");
      const product = await createProduct({
        isMedicalDevice: false,
        code: nextCode,
        name: item.name,
        specification: item.specification,
        category: item.category,
        productCategory: "auxiliary",
        status: "active",
        manufacturer: DEFAULT_MANUFACTURER,
        description: item.description,
      });
      console.log(`✓ 创建成功: ${nextCode} - ${item.name}`);
      successCount++;
    } catch (err: any) {
      console.error(`✗ 创建失败: ${item.name} - ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n===== 完成 =====`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  process.exit(0);
}

main().catch((err) => {
  console.error("脚本执行失败:", err);
  process.exit(1);
});
