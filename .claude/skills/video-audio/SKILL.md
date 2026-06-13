# 音视频处理 Skill
基于 ffmpeg 的音视频裁剪、合并、转码、提取。

## 使用方式
当用户说 "视频"、"音频"、"剪辑"、"裁剪"、"转码"、"提取音频"、"加字幕" 时触发。

## 工具
- ffmpeg（核心处理引擎）
- ffprobe（媒体信息查看）
- Python subprocess 封装

## 能力
1. 查看媒体信息（编码、分辨率、时长、码率）
2. 视频裁剪（按时间/按帧）
3. 视频合并/拼接
4. 格式转换（mp4/mkv/webm/gif）
5. 提取音频/替换音频
6. 压缩/调整分辨率/调整码率
7. 截图/生成缩略图
8. 添加水印/文字
9. 倍速播放/慢动作
10. GIF 生成

## 步骤
1. 先用 `ffprobe` 查看文件信息
2. 确认 ffmpeg 已安装（`which ffmpeg`）
3. 构造 ffmpeg 命令
4. 执行并验证输出
5. 大文件处理时显示进度

## 常用命令模板
- 裁剪: `ffmpeg -i in.mp4 -ss 00:10 -t 00:30 -c copy out.mp4`
- 转 GIF: `ffmpeg -i in.mp4 -vf "fps=10,scale=480:-1" out.gif`
- 提取音频: `ffmpeg -i in.mp4 -vn -acodec copy out.mp3`
