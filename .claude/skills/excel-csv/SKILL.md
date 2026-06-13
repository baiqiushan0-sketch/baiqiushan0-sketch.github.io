# Excel/CSV 表格数据处理 Skill
读取、分析、处理 Excel(.xlsx) 和 CSV 文件，生成报表和图表。

## 使用方式
当用户提到 "Excel"、"表格"、"CSV"、"报表"、"数据分析"、"透视表" 时触发。

## 工具
- Python + openpyxl（读写 xlsx）
- Python + pandas（数据分析）
- Python + csv（CSV 处理）

## 能力
1. 读取 xlsx/csv 文件内容，展示前 N 行
2. 数据清洗：去重、填充空值、格式转换
3. 数据分析：排序、筛选、分组、透视表
4. 生成汇总报表（写入新 xlsx）
5. 多表合并/拆分
6. CSV ↔ Excel 互转
7. 大数据文件分块读取

## 步骤
1. 先用 `pip install openpyxl pandas` 确保依赖
2. 读取文件 → 预览结构
3. 按用户需求执行操作
4. 输出结果文件
