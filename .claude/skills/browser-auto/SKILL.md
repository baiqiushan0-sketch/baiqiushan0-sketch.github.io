# 高级浏览器自动化 Skill
基于 Playwright 的网页操作、数据抓取、表单填写、截图对比。

## 使用方式
当用户说 "帮我填表"、"爬取数据"、"自动登录"、"截图对比"、"网页监控" 时触发。

## 工具
- Playwright（Chromium/Firefox/WebKit）
- Python/Node.js 脚本

## 能力
1. 打开网页截图（全页/元素/移动端）
2. 填写表单（文本框/下拉框/复选框/文件上传）
3. 自动登录（支持账号密码/Cookie 注入）
4. 数据爬取（列表/分页/详情）
5. 截图对比（像素级 diff）
6. 页面性能分析（Core Web Vitals）
7. 定时监控（价格/库存变化）
8. 导出为 PDF
9. 模拟移动端/不同分辨率
10. 网络请求拦截和 Mock

## 步骤
1. 确认 Playwright 已安装（`npx playwright install chromium`）
2. 编写 Playwright 脚本
3. 如果需要登录，优先使用已保存的 Cookie
4. 爬取数据时注意反爬：加延迟、模拟人类行为
5. 数据输出为 JSON/CSV
6. 截图保存到 screenshots/ 目录

## 反爬策略
- 设置合理的 User-Agent
- 操作间隔 0.5-2 秒随机延迟
- 滚动页面触发懒加载
- 遇到验证码提示用户手动介入
