import { App, PluginSettingTab, Setting } from "obsidian";
import type LifeJournalPlugin from "./main";

export type ThemeName =
  | "forest" | "ocean" | "desert" | "cherry"
  | "dusk" | "midnight" | "lavender" | "matcha";

// v1.1 新增：UI 风格（三套界面设计）
export type UIStyle = "minimal" | "neon" | "soft";

export interface SectionMapping {
  mood: string;
  present: string;
  thoughts: string;
  plans: string;
}

export interface LifeJournalSettings {
  theme: ThemeName;
  uiStyle: UIStyle;          // v1.1 新增
  sectionMapping: SectionMapping;
  diaryFolder: string;
  dateFormat: string;
}

export const DEFAULT_SETTINGS: LifeJournalSettings = {
  theme: "forest",
  uiStyle: "soft",           // 默认柔光卡片
  sectionMapping: {
    mood: "现在的心情",
    present: "记录现在",
    thoughts: "我的想法",
    plans: "后续计划",
  },
  diaryFolder: "Daily",
  dateFormat: "YYYY-MM-DD",
};

export const THEME_INFO: Record<ThemeName, { label: string; emoji: string; desc: string }> = {
  forest:   { label: "晨林",   emoji: "🌿", desc: "清晨森林，清新静谧" },
  ocean:    { label: "海浪",   emoji: "🌊", desc: "深海蓝调，平静辽远" },
  desert:   { label: "暮沙",   emoji: "🏜️", desc: "沙漠黄昏，温暖沉静" },
  cherry:   { label: "樱落",   emoji: "🌸", desc: "樱花粉调，柔美浪漫" },
  dusk:     { label: "暮霞",   emoji: "🌅", desc: "傍晚霞光，温柔余晖" },
  midnight: { label: "极夜",   emoji: "🌙", desc: "深邃夜色，沉稳神秘" },
  lavender: { label: "薰衣草", emoji: "💜", desc: "紫调梦幻，温柔治愈" },
  matcha:   { label: "抹茶",   emoji: "🍵", desc: "和风抹茶，清雅禅意" },
};

export const UI_STYLE_INFO: Record<UIStyle, { label: string; emoji: string; desc: string }> = {
  minimal: { label: "极简墨白", emoji: "◻️", desc: "纸质质感，克制留白，高级感纯黑白" },
  neon:    { label: "霓光深夜", emoji: "🌙", desc: "暗色沉浸，紫粉渐变，科技仪式感" },
  soft:    { label: "柔光卡片", emoji: "🌸", desc: "磨砂玻璃，暖橙紫渐变，温柔治愈" },
};

export class LifeJournalSettingTab extends PluginSettingTab {
  plugin: LifeJournalPlugin;

  constructor(app: App, plugin: LifeJournalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 顶部标题
    const header = containerEl.createDiv({ cls: "lj-settings-header" });
    header.createEl("h2", { text: "Life Journal" });
    header.createEl("p", { text: "v3.1.6 · 记录即意义", cls: "lj-settings-version" });

    // ── 界面风格 ──────────────────────────────────────
    containerEl.createEl("h3", { text: "✦ 界面风格" });
    containerEl.createEl("p", {
      text: "选择你喜欢的整体界面风格",
      cls: "lj-settings-hint"
    });

    const styleGrid = containerEl.createDiv({ cls: "lj-style-grid" });
    (Object.entries(UI_STYLE_INFO) as [UIStyle, typeof UI_STYLE_INFO[UIStyle]][]).forEach(([key, info]) => {
      const card = styleGrid.createDiv({
        cls: `lj-style-card lj-style-${key} ${this.plugin.settings.uiStyle === key ? "active" : ""}`
      });
      const preview = card.createDiv({ cls: "lj-style-preview" });
      preview.createDiv({ cls: "lj-style-emoji", text: info.emoji });
      card.createDiv({ cls: "lj-style-name", text: info.label });
      card.createDiv({ cls: "lj-style-desc", text: info.desc });
      card.addEventListener("click", async () => {
        styleGrid.querySelectorAll(".lj-style-card").forEach(c => c.removeClass("active"));
        card.addClass("active");
        this.plugin.settings.uiStyle = key;
        await this.plugin.saveSettings();
        this.plugin.applyUIStyle();
        // 重新渲染视图
        const view = this.plugin.getJournalView();
        if (view) view.buildUI();
      });
    });

    // ── 皮肤选择 ──────────────────────────────────────
    containerEl.createEl("h3", { text: "🎨 配色皮肤" });
    containerEl.createEl("p", {
      text: "在当前界面风格下应用配色（极简墨白风格下皮肤效果较弱）",
      cls: "lj-settings-hint"
    });

    const themeGrid = containerEl.createDiv({ cls: "lj-theme-grid" });
    (Object.entries(THEME_INFO) as [ThemeName, typeof THEME_INFO[ThemeName]][]).forEach(([key, info]) => {
      const card = themeGrid.createDiv({
        cls: `lj-theme-card lj-theme-${key} ${this.plugin.settings.theme === key ? "active" : ""}`
      });
      card.createDiv({ cls: "lj-theme-emoji", text: info.emoji });
      card.createDiv({ cls: "lj-theme-name", text: info.label });
      card.createDiv({ cls: "lj-theme-desc", text: info.desc });
      card.addEventListener("click", async () => {
        themeGrid.querySelectorAll(".lj-theme-card").forEach(c => c.removeClass("active"));
        card.addClass("active");
        this.plugin.settings.theme = key;
        await this.plugin.saveSettings();
        this.plugin.applyTheme();
      });
    });

    // ── 日记设置 ──────────────────────────────────────
    containerEl.createEl("h3", { text: "📁 日记目录" });

    new Setting(containerEl)
      .setName("日记文件夹")
      .setDesc("存放日记文件的文件夹路径（相对于vault根目录）")
      .addText(text => text
        .setPlaceholder("例如: Daily 或 Journal/Daily")
        .setValue(this.plugin.settings.diaryFolder)
        .onChange(async (value) => {
          this.plugin.settings.diaryFolder = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("日期格式")
      .setDesc("日记文件名的日期格式（使用 YYYY MM DD）")
      .addText(text => text
        .setPlaceholder("YYYY-MM-DD")
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value.trim() || "YYYY-MM-DD";
          await this.plugin.saveSettings();
        }));

    // ── 记录区块映射 ──────────────────────────────────
    containerEl.createEl("h3", { text: "📌 记录区块标题" });
    containerEl.createEl("p", {
      text: "每条记录会写入日记中对应的一级标题区块下，可自定义标题名称。",
      cls: "lj-settings-hint"
    });

    const sectionFields: { key: keyof SectionMapping; label: string; placeholder: string }[] = [
      { key: "mood",     label: "现在的心情",  placeholder: "现在的心情" },
      { key: "present",  label: "记录现在",    placeholder: "记录现在" },
      { key: "thoughts", label: "我的想法",    placeholder: "我的想法" },
      { key: "plans",    label: "后续计划",    placeholder: "后续计划" },
    ];

    sectionFields.forEach(({ key, label, placeholder }) => {
      new Setting(containerEl)
        .setName(label)
        .setDesc(`对应日记中的 "# ${this.plugin.settings.sectionMapping[key]}" 标题`)
        .addText(text => text
          .setPlaceholder(placeholder)
          .setValue(this.plugin.settings.sectionMapping[key])
          .onChange(async (value) => {
            this.plugin.settings.sectionMapping[key] = value.trim() || placeholder;
            await this.plugin.saveSettings();
          }));
    });

    // 底部版本信息
    const footer = containerEl.createDiv({ cls: "lj-settings-footer" });
    footer.createEl("span", { text: "Life Journal v3.1.6 · 记录即意义 ✦" });
  }
}
