import os

path = '/home/ubuntu/gtp-erp-/server/routers.ts'
with open(path, 'r') as f:
    lines = f.readlines()

# 清理导入部分
new_lines = []
skip = False
for line in lines:
    if 'getRecycleBinEntries' in line and 'getOvertimeRequestById' in line:
        # 修复重复行
        new_lines.append('  getRecycleBinEntries,\n')
        continue
    if 'trainings as trainingsTable' in line and 'auditsTabl' in line:
        # 修复截断行
        new_lines.append('  trainings as trainingsTable, personnel as personnelTable,\n')
        continue
    if '} from "../drizzle/schema";ertimeTable' in line:
        # 修复重复行
        continue
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)
