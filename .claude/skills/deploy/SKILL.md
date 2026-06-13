# 一键部署 Skill
快速部署到公网 URL，方便手机或其他设备访问测试。

## 使用方式
当用户说 "部署"、"生成链接"、"手机打开"、"分享链接" 时触发。

## 步骤
1. 确保 HTTP 服务器在 8080 端口运行
2. 使用 npx localtunnel --port 8080 生成临时公网 URL
3. 或使用 npx ngrok http 8080
4. 返回公网 URL，用户手机扫码即可打开
5. 注意：摄像头需要 HTTPS（localtunnel/ngrok 自动提供）
