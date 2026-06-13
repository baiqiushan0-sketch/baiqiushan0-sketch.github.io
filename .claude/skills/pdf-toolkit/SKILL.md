# PDF 全套处理 Skill
读取、合并、拆分、提取 PDF 文件内容。

## 使用方式
当用户说 "PDF"、"提取PDF中的"、"合并PDF"、"PDF转" 时触发。

## 工具
- Python + PyPDF2 / pypdf（合并拆分旋转）
- Python + pdfplumber（提取文字和表格）
- Python + pdf2image + pytesseract（OCR 扫描件）
- Python + reportlab（生成PDF）

## 能力
1. 读取 PDF 文字内容
2. 提取 PDF 中的表格数据
3. 合并多个 PDF 为一个
4. 拆分 PDF（提取指定页）
5. OCR 扫描件识别文字
6. 网页/HTML 转 PDF
7. PDF 转图片预览
8. 添加/删除页面

## 步骤
1. `pip install pypdf pdfplumber pdf2image pytesseract reportlab`
2. 根据需求选择对应工具
3. 处理完成后输出到指定路径
