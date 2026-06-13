# Web 页面验证 Skill
验证手势交互页面是否正常运行，截图查看效果、抓取控制台错误。

## 使用方式
当用户说 "验证页面"、"截图看看"、"检查是否正常" 时触发。

## 步骤
1. 确保 HTTP 服务器在 homepage 目录运行（python -m http.server 8080）
2. 用 Playwright 打开 http://localhost:8080/gesture-3d.html
3. 等待 3 秒让页面加载
4. 截图保存到 homepage/screenshots/
5. 抓取控制台错误日志
6. 检查关键元素是否存在：Canvas、摄像头提示、手势提示条
7. 汇报结果
