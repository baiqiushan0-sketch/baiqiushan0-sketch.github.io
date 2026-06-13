# Git 版本快照 Skill
每次修改前后自动 commit，方便回退到任意历史版本。

## 使用方式
当用户说 "保存当前版本"、"commit"、"回退"、"版本管理" 时触发。

## 步骤
1. 修改代码前先 `git add -A && git commit -m "快照: <当前状态描述>"`
2. 修改完成后 `git add -A && git commit -m "<改动说明>"`
3. 用户想回退时 `git log --oneline -10` 展示最近版本，用户选择后 `git checkout <commit>`
4. 查看改动 `git diff`
