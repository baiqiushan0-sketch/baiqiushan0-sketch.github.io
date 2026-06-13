# AI 图片生成 Skill
接入 AI 图片生成 API，文字描述 → 图片输出。

## 使用方式
当用户说 "画一个"、"生成图片"、"架构图"、"示意图"、"海报"、"配图" 时触发。

## 工具
- OpenAI DALL-E API（优先，质量高）
- Stable Diffusion API（备选，免费额度）
- Python PIL/Pillow（图片后处理）

## 能力
1. 文字描述 → 生成图片
2. 生成架构图/流程图提示词
3. 图片拼接/加文字/调整尺寸
4. 批量生成变体

## 步骤
1. 分析用户需求，撰写高质量英文 prompt
2. 调用 API 生成图片
3. 下载保存到指定目录
4. 如需修改，迭代 prompt 重新生成
5. 确保 API key 从环境变量读取

## Prompt 优化原则
- 描述主体 + 风格 + 构图 + 光照 + 画质关键词
- 架构图类：white background, clean lines, minimal, technical diagram
- 创意类：4K, detailed, cinematic lighting
