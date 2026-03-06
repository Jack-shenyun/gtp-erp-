#!/bin/bash
# 批量创建产品脚本
# 通过 tRPC API 创建：3个原材料、2个半成品、3个辅料

BASE_URL="http://localhost:3000/api/trpc"
COOKIE="session=demo-session"
MANUFACTURER="苏州神韵医疗器械有限公司"

create_product() {
  local CODE="$1"
  local NAME="$2"
  local SPEC="$3"
  local CATEGORY="$4"
  local PROD_CATEGORY="$5"
  local DESC="$6"

  RESULT=$(curl -s -X POST "${BASE_URL}/products.create" \
    -H "Content-Type: application/json" \
    -H "Cookie: ${COOKIE}" \
    -d "{\"json\":{\"isMedicalDevice\":false,\"code\":\"${CODE}\",\"name\":\"${NAME}\",\"specification\":\"${SPEC}\",\"category\":\"${CATEGORY}\",\"productCategory\":\"${PROD_CATEGORY}\",\"status\":\"active\",\"manufacturer\":\"${MANUFACTURER}\",\"description\":\"${DESC}\"}}" 2>&1)
  
  if echo "$RESULT" | grep -q '"data"'; then
    echo "✓ 创建成功: ${CODE} - ${NAME}"
  else
    echo "✗ 创建失败: ${CODE} - ${NAME} | 响应: ${RESULT}"
  fi
}

get_next_code() {
  local PREFIX="$1"
  curl -s "${BASE_URL}/products.nextCode" \
    -G \
    --data-urlencode "input={\"json\":{\"prefix\":\"${PREFIX}\"}}" \
    -H "Cookie: ${COOKIE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['data']['json'])"
}

echo "===== 开始批量创建产品 ====="
echo ""

# ===== 原材料 2、3（YCL-00001 已创建）=====
echo "--- 原材料（YCL）---"

YCL2=$(get_next_code "YCL")
create_product "$YCL2" "医用聚氨酯颗粒" "粒径3-5mm，白色" "oem" "raw_material" "热塑性聚氨酯弹性体，用于医用导管挤出成型"

YCL3=$(get_next_code "YCL")
create_product "$YCL3" "医用不锈钢丝" "直径0.3mm，316L不锈钢" "oem" "raw_material" "用于医用导管加强层编织，耐腐蚀性强"

echo ""
echo "--- 半成品（BCP）---"

BCP1=$(get_next_code "BCP")
create_product "$BCP1" "硅胶管坯料" "内径4mm×外径6mm，未裁切" "oem" "semi_finished" "经挤出成型的硅胶管半成品，待后续裁切和表面处理"

BCP2=$(get_next_code "BCP")
create_product "$BCP2" "导管编织体" "内径3mm，三层编织结构" "oem" "semi_finished" "完成编织工序的导管中间体，待灌胶和端头处理"

echo ""
echo "--- 辅料（FL）---"

FL1=$(get_next_code "FL")
create_product "$FL1" "医用环氧乙烷灭菌袋" "150mm×250mm，透析纸/PE复合膜" "oem" "auxiliary" "用于医疗器械EO灭菌包装，符合YY/T 0698标准"

FL2=$(get_next_code "FL")
create_product "$FL2" "医用润滑剂" "500ml/瓶，水溶性" "oem" "auxiliary" "用于导管生产过程中的润滑处理，生物相容性好"

FL3=$(get_next_code "FL")
create_product "$FL3" "产品标签纸" "60mm×40mm，热敏不干胶" "oem" "auxiliary" "用于产品包装标签打印，耐高温灭菌处理"

echo ""
echo "===== 完成 ====="
