# GitHub 全流程管理 Skill
通过 GitHub CLI/API 管理 Issues、PRs、Actions、Releases。

## 使用方式
当用户说 "创建Issue"、"Review PR"、"GitHub"、"Release"、"提交PR" 时触发。

## 工具
- gh CLI（GitHub 官方命令行）
- GitHub REST API（高级操作）
- git（本地操作）

## 能力
1. 创建/查看/关闭 Issues（支持 label、assignee、milestone）
2. 查看/Review/Merge PRs
3. 查看 Actions 运行状态和日志
4. 生成 Release Notes
5. 管理 Projects/Kanban
6. 搜索 Issues/PRs/Code
7. 查看 Repo 统计信息
8. 管理 Secrets 和 Variables

## 步骤
1. 先检查 `gh auth status` 确认登录
2. 按用户需求执行操作
3. PR Review 时会检查：代码规范、安全漏洞、测试覆盖、性能问题
4. 操作后反馈结果
