# Life Journal

> Record your moods, moments, thoughts, and plans — make every day meaningful.

Life Journal is a beautifully designed Obsidian plugin that turns your vault into a personal journal. With multiple UI styles, 8 color themes, smart date recognition, and image support, it makes recording your life effortless and enjoyable.

![Life Journal](https://img.shields.io/badge/Obsidian-Plugin-purple)

## Features

### 📝 Four Recording Tabs
- **Mood** ✨ — Pick a mood, add a note, and save
- **Record** 📝 — Capture what happened right now
- **Thoughts** 💭 — Quick-capture fleeting ideas
- **Plans** 🗓 — Add to-dos with smart date recognition

### 📖 Review Mode
- Browse all entries in a beautiful waterfall card layout
- Filter by type: All / Mood / Record / Thoughts / Plans
- Inline tag (`#tag`) click-to-filter
- Two-way todo sync: check/uncheck tasks directly in review

### 🎨 Three UI Styles + 8 Color Themes
- **Minimal Ink** — Clean black & white, paper texture
- **Neon Night** — Dark immersive, gradient glow
- **Soft Blur** — Frosted glass, warm gradient (default)

8 color themes: Forest 🌿 / Ocean 🌊 / Desert 🏜️ / Cherry 🌸 / Dusk 🌅 / Midnight 🌙 / Lavender 💜 / Matcha 🍵

### 🧠 Smart Features
- **Natural language date extraction** — Type "finish report by this Friday" and the date is auto-detected
- **Image support** — Paste or upload images directly (Ctrl+V / 📷 button)
- **Inline tags** — Type `#work` `#study` and tags are auto-recognized
- **Markdown rendering** — Review cards render markdown properly

### 📱 Mobile Friendly
- Responsive layout adapts to phone screens
- Condensed mood pills (4 moods on mobile)
- Visual viewport keyboard handling

## How It Works

Life Journal writes to daily markdown files in your vault (e.g., `Daily/2026-05-22.md`). Each entry is timestamped and organized under section headings:

```markdown
# 🌿 心情

- 22:30 😄 开心 — Had a great day today!

# 📝 记录

- 22:35 Finished the Life Journal plugin

# 💭 想法

- 22:40 What if I could track habits too?

# 🗓 计划

**22:45 计划**
- [ ] Finish documentation 📅 2026-05-23
- [x] Write plugin code
```

All data lives in your vault — no cloud, no lock-in.

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open **Settings → Community Plugins**
2. Click **Browse** to open the community plugin browser
3. Search for **"Life Journal"**
4. Click **Install**, then click **Enable**

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/iamxiaoming-gif/life-journal/releases)
2. Create a folder named `life-journal` in your vault's `.obsidian/plugins/` directory
3. Copy the three files into that folder
4. Restart Obsidian, then go to **Settings → Community Plugins** and enable **Life Journal**

## Usage

1. After enabling the plugin, click the **Life Journal** icon in the left sidebar to open the journal panel
2. Choose a tab: **Mood** ✨ / **Record** 📝 / **Thoughts** 💭 / **Plans** 🗓
3. Type your content and click the **Save** button — entries are written to daily markdown files in your vault
4. Switch to **Review mode** (top toggle) to browse past entries in a waterfall card layout
5. In Review mode, click `#tags` to filter entries, or check/uncheck tasks directly

## Configuration

After enabling the plugin, open its settings to configure:

- **Diary Folder** — Where your daily journal files are stored (default: `Daily`)
- **UI Style** — Minimal Ink / Neon Night / Soft Blur
- **Color Theme** — Choose from 8 beautiful themes
- **Section Headings** — Customize the heading text for each tab

## Plugin Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Diary Folder | `Daily` | Vault folder for daily markdown files |
| UI Style | `Soft Blur` | Visual style of the plugin interface |
| Color Theme | `Forest` | Color scheme applied to all UI elements |
| Mood Heading | `🌿 心情` | Markdown heading for the Mood section |
| Record Heading | `📝 记录` | Markdown heading for the Record section |
| Thoughts Heading | `💭 想法` | Markdown heading for the Thoughts section |
| Plans Heading | `🗓 计划` | Markdown heading for the Plans section |

## Compatibility

- **Obsidian version**: 0.15.0+
- **Platforms**: Desktop & Mobile
- **No internet required**: All data is stored locally in your vault

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Natural Growth Notes** — [GitHub](https://github.com/iamxiaoming-gif)

## Follow & Support

If you enjoy Life Journal, follow us for more Obsidian tips and knowledge management content:

- 📕 **Xiaohongshu (小红书)**: 自然成长笔记
- 💬 **WeChat Official Account (微信公众号)**: 自然成长笔记
- 🎵 **Douyin (抖音)**: 自然成长笔记

If this plugin helps you, consider giving it a ⭐ on GitHub — it means a lot!

---

# Life Journal · 中文说明

> 记录即意义 · 随时记录心情、当下、想法与计划，让生命留有痕迹。

Life Journal 是一款精心设计的 Obsidian 日记插件，多种 UI 风格、8 套配色、智能日期识别、图片上传，让记录生活变得轻松愉悦。

## 核心功能

### 📝 四个记录 Tab
- **心情** ✨ — 选心情 + 写备注，一键记录
- **记录** 📝 — 记下此刻发生了什么
- **想法** 💭 — 捕捉脑中闪过的念头
- **计划** 🗓 — 添加待办，智能识别日期

### 📖 回顾模式
- 瀑布流卡片浏览所有记录
- 按类型筛选：全部 / 心情 / 记录 / 想法 / 计划
- 点击 `#标签` 快速筛选
- 任务双向同步：回顾中勾选/取消待办

### 🎨 三套 UI 风格 + 8 套配色
- **极简墨白** — 纸质质感，克制留白
- **霓光深夜** — 暗色沉浸，渐变光晕
- **柔光卡片** — 磨砂玻璃，暖橙紫渐变（默认）

8 套配色：晨林🌿 / 海浪🌊 / 暮沙🏜️ / 樱落🌸 / 暮霞🌅 / 极夜🌙 / 薰衣草💜 / 抹茶🍵

### 🧠 智能功能
- **自然语义日期** — 输入"本周五完成报告"自动提取截止日期
- **图片支持** — 粘贴或上传图片（Ctrl+V / 📷按钮）
- **行内标签** — 输入 `#工作` `#学习` 自动识别
- **Markdown 渲染** — 回顾卡片正确渲染 markdown

### 📱 移动端适配
- 响应式布局适配手机屏幕
- 移动端心情精简为 4 个
- 视口高度自动适配键盘弹起

## 安装

### 从 Obsidian 社区插件市场安装（推荐）
1. 打开 设置 → 第三方插件
2. 搜索 "Life Journal"
3. 点击安装，然后启用

### 手动安装
1. 从 [最新发布](https://github.com/iamxiaoming-gif/life-journal/releases) 下载 `main.js`、`manifest.json` 和 `styles.css`
2. 在 vault 的 `.obsidian/plugins/` 目录下创建 `life-journal` 文件夹
3. 将三个文件复制到该文件夹
4. 在 设置 → 第三方插件 中启用插件

## 关注与支持

如果你喜欢 Life Journal，欢迎关注「自然成长笔记」获取更多 Obsidian 技巧和知识管理内容：

- 📕 **小红书**：自然成长笔记
- 💬 **微信公众号**：自然成长笔记
- 🎵 **抖音**：自然成长笔记

觉得好用的话，给个 GitHub ⭐ 吧，这对我们很重要！
