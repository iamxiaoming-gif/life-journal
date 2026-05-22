# Life Journal

> Record your moods, moments, thoughts, and plans 鈥?make every day meaningful.

Life Journal is a beautifully designed Obsidian plugin that turns your vault into a personal journal. With multiple UI styles, 8 color themes, smart date recognition, and image support, it makes recording your life effortless and enjoyable.

![Life Journal](https://img.shields.io/badge/Obsidian-Plugin-purple)

## Features

### 馃摑 Four Recording Tabs
- **Mood** 鉁?鈥?Pick a mood, add a note, and save
- **Record** 馃摑 鈥?Capture what happened right now
- **Thoughts** 馃挱 鈥?Quick-capture fleeting ideas
- **Plans** 馃棑 鈥?Add to-dos with smart date recognition

### 馃摉 Review Mode
- Browse all entries in a beautiful waterfall card layout
- Filter by type: All / Mood / Record / Thoughts / Plans
- Inline tag (`#tag`) click-to-filter
- Two-way todo sync: check/uncheck tasks directly in review

### 馃帹 Three UI Styles + 8 Color Themes
- **Minimal Ink** 鈥?Clean black & white, paper texture
- **Neon Night** 鈥?Dark immersive, gradient glow
- **Soft Blur** 鈥?Frosted glass, warm gradient (default)

8 color themes: Forest 馃尶 / Ocean 馃寠 / Desert 馃彍锔?/ Cherry 馃尭 / Dusk 馃寘 / Midnight 馃寵 / Lavender 馃挏 / Matcha 馃嵉

### 馃 Smart Features
- **Natural language date extraction** 鈥?Type "finish report by this Friday" and the date is auto-detected
- **Image support** 鈥?Paste or upload images directly (Ctrl+V / 馃摲 button)
- **Inline tags** 鈥?Type `#work` `#study` and tags are auto-recognized
- **Markdown rendering** 鈥?Review cards render markdown properly

### 馃摫 Mobile Friendly
- Responsive layout adapts to phone screens
- Condensed mood pills (4 moods on mobile)
- Visual viewport keyboard handling

## How It Works

Life Journal writes to daily markdown files in your vault (e.g., `Daily/2026-05-22.md`). Each entry is timestamped and organized under section headings:

```markdown
# 馃尶 蹇冩儏

- 22:30 馃槃 寮€蹇?鈥?Had a great day today!

# 馃摑 璁板綍

- 22:35 Finished the Life Journal plugin

# 馃挱 鎯虫硶

- 22:40 What if I could track habits too?

# 馃棑 璁″垝

**22:45 璁″垝**
- [ ] Finish documentation 馃搮 2026-05-23
- [x] Write plugin code
```

All data lives in your vault 鈥?no cloud, no lock-in.

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open **Settings 鈫?Community Plugins**
2. Click **Browse** to open the community plugin browser
3. Search for **"Life Journal"**
4. Click **Install**, then click **Enable**

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/iamxiaoming-gif/life-journal/releases)
2. Create a folder named `life-journal` in your vault's `.obsidian/plugins/` directory
3. Copy the three files into that folder
4. Restart Obsidian, then go to **Settings 鈫?Community Plugins** and enable **Life Journal**

## Usage

1. After enabling the plugin, click the **Life Journal** icon in the left sidebar to open the journal panel
2. Choose a tab: **Mood** 鉁?/ **Record** 馃摑 / **Thoughts** 馃挱 / **Plans** 馃棑
3. Type your content and click the **Save** button 鈥?entries are written to daily markdown files in your vault
4. Switch to **Review mode** (top toggle) to browse past entries in a waterfall card layout
5. In Review mode, click `#tags` to filter entries, or check/uncheck tasks directly

## Configuration

After enabling the plugin, open its settings to configure:

- **Diary Folder** 鈥?Where your daily journal files are stored (default: `Daily`)
- **UI Style** 鈥?Minimal Ink / Neon Night / Soft Blur
- **Color Theme** 鈥?Choose from 8 beautiful themes
- **Section Headings** 鈥?Customize the heading text for each tab

## Plugin Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Diary Folder | `Daily` | Vault folder for daily markdown files |
| UI Style | `Soft Blur` | Visual style of the plugin interface |
| Color Theme | `Forest` | Color scheme applied to all UI elements |
| Mood Heading | `馃尶 蹇冩儏` | Markdown heading for the Mood section |
| Record Heading | `馃摑 璁板綍` | Markdown heading for the Record section |
| Thoughts Heading | `馃挱 鎯虫硶` | Markdown heading for the Thoughts section |
| Plans Heading | `馃棑 璁″垝` | Markdown heading for the Plans section |

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

MIT License 鈥?see [LICENSE](LICENSE) for details.

## Author

**Natural Growth Notes** 鈥?[GitHub](https://github.com/iamxiaoming-gif)

## Follow & Support

If you enjoy Life Journal, follow us for more Obsidian tips and knowledge management content:

- 馃摃 **Xiaohongshu (灏忕孩涔?**: 鑷劧鎴愰暱绗旇
- 馃挰 **WeChat Official Account (寰俊鍏紬鍙?**: 鑷劧鎴愰暱绗旇
- 馃幍 **Douyin (鎶栭煶)**: 鑷劧鎴愰暱绗旇

If this plugin helps you, consider giving it a 猸?on GitHub 鈥?it means a lot!

---

# Life Journal 路 涓枃璇存槑

> 璁板綍鍗虫剰涔?路 闅忔椂璁板綍蹇冩儏銆佸綋涓嬨€佹兂娉曚笌璁″垝锛岃鐢熷懡鐣欐湁鐥曡抗銆?
Life Journal 鏄竴娆剧簿蹇冭璁＄殑 Obsidian 鏃ヨ鎻掍欢锛屽绉?UI 椋庢牸銆? 濂楅厤鑹层€佹櫤鑳芥棩鏈熻瘑鍒€佸浘鐗囦笂浼狅紝璁╄褰曠敓娲诲彉寰楄交鏉炬剦鎮︺€?
## 鏍稿績鍔熻兘

### 馃摑 鍥涗釜璁板綍 Tab
- **蹇冩儏** 鉁?鈥?閫夊績鎯?+ 鍐欏娉紝涓€閿褰?- **璁板綍** 馃摑 鈥?璁颁笅姝ゅ埢鍙戠敓浜嗕粈涔?- **鎯虫硶** 馃挱 鈥?鎹曟崏鑴戜腑闂繃鐨勫康澶?- **璁″垝** 馃棑 鈥?娣诲姞寰呭姙锛屾櫤鑳借瘑鍒棩鏈?
### 馃摉 鍥為【妯″紡
- 鐎戝竷娴佸崱鐗囨祻瑙堟墍鏈夎褰?- 鎸夌被鍨嬬瓫閫夛細鍏ㄩ儴 / 蹇冩儏 / 璁板綍 / 鎯虫硶 / 璁″垝
- 鐐瑰嚮 `#鏍囩` 蹇€熺瓫閫?- 浠诲姟鍙屽悜鍚屾锛氬洖椤句腑鍕鹃€?鍙栨秷寰呭姙

### 馃帹 涓夊 UI 椋庢牸 + 8 濂楅厤鑹?- **鏋佺畝澧ㄧ櫧** 鈥?绾歌川璐ㄦ劅锛屽厠鍒剁暀鐧?- **闇撳厜娣卞** 鈥?鏆楄壊娌夋蹈锛屾笎鍙樺厜鏅?- **鏌斿厜鍗＄墖** 鈥?纾ㄧ爞鐜荤拑锛屾殩姗欑传娓愬彉锛堥粯璁わ級

8 濂楅厤鑹诧細鏅ㄦ灄馃尶 / 娴锋氮馃寠 / 鏆矙馃彍锔?/ 妯辫惤馃尭 / 鏆湠馃寘 / 鏋佸馃寵 / 钖拌。鑽夝煉?/ 鎶硅尪馃嵉

### 馃 鏅鸿兘鍔熻兘
- **鑷劧璇箟鏃ユ湡** 鈥?杈撳叆"鏈懆浜斿畬鎴愭姤鍛?鑷姩鎻愬彇鎴鏃ユ湡
- **鍥剧墖鏀寔** 鈥?绮樿创鎴栦笂浼犲浘鐗囷紙Ctrl+V / 馃摲鎸夐挳锛?- **琛屽唴鏍囩** 鈥?杈撳叆 `#宸ヤ綔` `#瀛︿範` 鑷姩璇嗗埆
- **Markdown 娓叉煋** 鈥?鍥為【鍗＄墖姝ｇ‘娓叉煋 markdown

### 馃摫 绉诲姩绔€傞厤
- 鍝嶅簲寮忓竷灞€閫傞厤鎵嬫満灞忓箷
- 绉诲姩绔績鎯呯簿绠€涓?4 涓?- 瑙嗗彛楂樺害鑷姩閫傞厤閿洏寮硅捣

## 瀹夎

### 浠?Obsidian 绀惧尯鎻掍欢甯傚満瀹夎锛堟帹鑽愶級
1. 鎵撳紑 璁剧疆 鈫?绗笁鏂规彃浠?2. 鎼滅储 "Life Journal"
3. 鐐瑰嚮瀹夎锛岀劧鍚庡惎鐢?
### 鎵嬪姩瀹夎
1. 浠?[鏈€鏂板彂甯僝(https://github.com/iamxiaoming-gif/life-journal/releases) 涓嬭浇 `main.js`銆乣manifest.json` 鍜?`styles.css`
2. 鍦?vault 鐨?`.obsidian/plugins/` 鐩綍涓嬪垱寤?`life-journal` 鏂囦欢澶?3. 灏嗕笁涓枃浠跺鍒跺埌璇ユ枃浠跺す
4. 鍦?璁剧疆 鈫?绗笁鏂规彃浠?涓惎鐢ㄦ彃浠?
## 鍏虫敞涓庢敮鎸?
濡傛灉浣犲枩娆?Life Journal锛屾杩庡叧娉ㄣ€岃嚜鐒舵垚闀跨瑪璁般€嶈幏鍙栨洿澶?Obsidian 鎶€宸у拰鐭ヨ瘑绠＄悊鍐呭锛?
- 馃摃 **灏忕孩涔?*锛氳嚜鐒舵垚闀跨瑪璁?- 馃挰 **寰俊鍏紬鍙?*锛氳嚜鐒舵垚闀跨瑪璁?- 馃幍 **鎶栭煶**锛氳嚜鐒舵垚闀跨瑪璁?
瑙夊緱濂界敤鐨勮瘽锛岀粰涓?GitHub 猸?鍚э紝杩欏鎴戜滑寰堥噸瑕侊紒
