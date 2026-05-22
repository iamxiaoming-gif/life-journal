import { ItemView, WorkspaceLeaf, Notice, moment, TFile } from "obsidian";
import type LifeJournalPlugin from "./main";
import { appendToSection } from "./fileManager";
import type { SectionMapping, UIStyle } from "./settings";
import { ReviewView } from "./ReviewView";
import type { TodoItem } from "./fileReader";

export const VIEW_TYPE_JOURNAL = "life-journal-view";

const MOODS_PC = [
  { key: "joy",       emoji: "\u{1F604}", label: "\u5F00\u5FC3" },
  { key: "calm",      emoji: "\u{1F60C}", label: "\u5E73\u9759" },
  { key: "tired",     emoji: "\u{1F634}", label: "\u75B2\u60EB" },
  { key: "anxious",   emoji: "\u{1F61F}", label: "\u7126\u8651" },
  { key: "sad",       emoji: "\u{1F622}", label: "\u96BE\u8FC7" },
  { key: "excited",   emoji: "\u{1F929}", label: "\u5174\u594B" },
  { key: "grateful",  emoji: "\u{1F970}", label: "\u611F\u6069" },
  { key: "angry",     emoji: "\u{1F624}", label: "\u70E6\u8E81" },
] as const;

const MOODS_MOBILE = [
  { key: "joy",     emoji: "\u{1F604}", label: "\u5FEB\u4E50" },
  { key: "sad",     emoji: "\u{1F622}", label: "\u96BE\u8FC7" },
  { key: "anxious", emoji: "\u{1F61F}", label: "\u7126\u8651" },
  { key: "angry",   emoji: "\u{1F624}", label: "\u70E6\u8E81" },
] as const;

function isMobile(): boolean { return window.innerWidth < 600; }

function extractInlineTags(text: string): string[] {
  const regex = /(^|[\s\u3000"'`([{<\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001\uFF08\uFF09\u3010\u3011\u300A\u300B\u300C\u300D\u300E\u300F,.;!?])#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu;
  const tags: string[] = [];
  let m;
  while ((m = regex.exec(text)) !== null) { tags.push(m[2]); }
  return [...new Set(tags)];
}

/**
 * 从混合文本中自动提取日期关键词
 * 如"本周五完成计划的制定" → { date: "2026-05-23", text: "完成计划的制定", keyword: "本周五" }
 * 如果文本中有独立的截止日期输入框值，则优先使用 parseSmartDate 解析
 */
function extractDateFromText(input: string): { date: string | undefined; text: string; keyword?: string } {
  const today = moment();
  const trimmed = input.trim();

  // 日期关键词列表（按优先级：越精确的越靠前）
  const patterns: { regex: RegExp; calc: (match: RegExpMatchArray) => string | undefined; keyword: string }[] = [
    // 明天/后天/大后天
    { regex: /(明天)/, calc: () => today.clone().add(1, "day").format("YYYY-MM-DD"), keyword: "明天" },
    { regex: /(后天)/, calc: () => today.clone().add(2, "day").format("YYYY-MM-DD"), keyword: "后天" },
    { regex: /(大后天)/, calc: () => today.clone().add(3, "day").format("YYYY-MM-DD"), keyword: "大后天" },
    // N天后
    { regex: /(\d+)天后/, calc: (m) => today.clone().add(parseInt(m[1]), "day").format("YYYY-MM-DD"), keyword: "N天后" },
    // 本周X
    { regex: /本周([一二三四五六日天])/, calc: (m) => {
      const wm: Record<string, number> = { "\u4E00": 1, "\u4E8C": 2, "\u4E09": 3, "\u56DB": 4, "\u4E94": 5, "\u516D": 6, "\u65E5": 0, "\u5929": 0 };
      const t = wm[m[1]]; if (t === undefined) return undefined;
      let d = t - today.day(); if (d < 0) d += 7;
      return today.clone().add(d, "day").format("YYYY-MM-DD");
    }, keyword: "本周X" },
    // 下周X
    { regex: /下周([一二三四五六日天])/, calc: (m) => {
      const wm: Record<string, number> = { "\u4E00": 1, "\u4E8C": 2, "\u4E09": 3, "\u56DB": 4, "\u4E94": 5, "\u516D": 6, "\u65E5": 0, "\u5929": 0 };
      const t = wm[m[1]]; if (t === undefined) return undefined;
      return today.clone().add(t - today.day() + 7, "day").format("YYYY-MM-DD");
    }, keyword: "下周X" },
    // 今天（作为截止日期）
    { regex: /(今天)/, calc: () => today.format("YYYY-MM-DD"), keyword: "今天" },
    // YYYY-MM-DD
    { regex: /(\d{4}-\d{2}-\d{2})/, calc: (m) => moment(m[1]).isValid() ? m[1] : undefined, keyword: "ISO日期" },
    // M月D日
    { regex: /(\d{1,2})月(\d{1,2})日/, calc: (m) => today.format("YYYY") + "-" + String(parseInt(m[1])).padStart(2, "0") + "-" + String(parseInt(m[2])).padStart(2, "0"), keyword: "月日" },
  ];

  for (const p of patterns) {
    const match = trimmed.match(p.regex);
    if (match) {
      const date = p.calc(match);
      if (date) {
        // 从文本中移除日期关键词部分
        const cleanText = trimmed.replace(p.regex, "").trim().replace(/^[，。、\s]+/, "").replace(/[，。、\s]+$/, "").trim();
        return { date, text: cleanText || trimmed, keyword: match[0] };
      }
    }
  }

  return { date: undefined, text: trimmed };
}

function formatDueDate(dateStr: string): string {
  const due = moment(dateStr).startOf("day");
  const diff = due.diff(moment().startOf("day"), "day");
  if (diff === 0) return "\u4ECA\u5929";
  if (diff === 1) return "\u660E\u5929";
  if (diff < 0) return `${Math.abs(diff)}\u5929\u524D`;
  if (diff <= 7) return `${diff}\u5929\u540E`;
  return `${due.month() + 1}\u6708${due.date()}\u65E5`;
}

export class LifeJournalView extends ItemView {
  plugin: LifeJournalPlugin;
  private selectedMood: string | null = null;
  private activeTab: keyof SectionMapping = "mood";
  private todoItems: TodoItem[] = [];
  private viewMode: "record" | "review" = "record";
  private _vpResizeHandler: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: LifeJournalPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_JOURNAL; }
  getDisplayText(): string { return "Life Journal"; }
  getIcon(): string { return "book-open"; }

  async onOpen() {
    this.buildUI();
    this.setupViewportAdapter();
  }

  async onClose() {
    this.teardownViewportAdapter();
  }

  private setupViewportAdapter() {
    const vp = window.visualViewport;
    if (!vp) return;
    this._vpResizeHandler = () => {
      const root = this.containerEl.children[1] as HTMLElement;
      if (!root) return;
      const h = Math.round(vp.height);
      root.style.height = h + "px";
      root.style.maxHeight = h + "px";
      root.scrollTop = root.scrollHeight;
    };
    vp.addEventListener("resize", this._vpResizeHandler);
  }

  private teardownViewportAdapter() {
    const vp = window.visualViewport;
    if (vp && this._vpResizeHandler) {
      vp.removeEventListener("resize", this._vpResizeHandler);
      this._vpResizeHandler = null;
    }
  }

  buildUI() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.setAttribute("class", "lj-root");
    root.style.height = "";
    root.style.maxHeight = "";
    const style = this.plugin.settings.uiStyle;
    if (style === "minimal") this.buildMinimalHeader(root);
    else if (style === "neon") this.buildNeonHeader(root);
    else this.buildSoftHeader(root);
    this.buildModeToggleFixed(root);
    if (this.viewMode === "review") {
      root.addClass("lj-root-review-v3");
      const rc = root.createDiv({ cls: "lj-review-container" });
      new ReviewView(rc, this.plugin).render();
      return;
    }
    this.buildTabsAndContent(root, style);
  }

  private buildModeToggleFixed(root: HTMLElement) {
    const bar = root.createDiv({ cls: "lj-mode-toggle-bar lj-mode-toggle-fixed" });
    const toggle = bar.createDiv({ cls: "lj-mode-toggle" });
    const rb = toggle.createDiv({ cls: `lj-mode-btn ${this.viewMode === "record" ? "active" : ""}`, text: "\u270D\uFE0F \u8BB0\u5F55" });
    const rv = toggle.createDiv({ cls: `lj-mode-btn ${this.viewMode === "review" ? "active" : ""}`, text: "\u{1F4D6} \u56DE\u987E" });
    rb.addEventListener("click", () => { if (this.viewMode !== "record") { this.viewMode = "record"; this.buildUI(); } });
    rv.addEventListener("click", () => { if (this.viewMode !== "review") { this.viewMode = "review"; this.buildUI(); } });
  }

  private buildMinimalHeader(root: HTMLElement) {
    const d = new Date();
    const header = root.createDiv({ cls: "lj-header" });
    const left = header.createDiv({ cls: "lj-header-left" });
    left.createDiv({ cls: "lj-date-tiny", text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() + " \xB7 " + ["\u65E5","\u4E00","\u4E8C","\u4E09","\u56DB","\u4E94","\u516D"][d.getDay()] });
    left.createDiv({ cls: "lj-title", text: "Life Journal" });
    header.createDiv({ cls: "lj-header-icon", text: "\u2726" });
  }

  private buildNeonHeader(root: HTMLElement) {
    const d = new Date();
    const header = root.createDiv({ cls: "lj-header" });
    const toprow = header.createDiv({ cls: "lj-header-toprow" });
    const logoWrap = toprow.createDiv({ cls: "lj-logo-wrap" });
    logoWrap.createDiv({ cls: "lj-logo-icon", text: "\u2726" });
    logoWrap.createDiv({ cls: "lj-logo-text", text: "Life Journal" });
    toprow.createDiv({ cls: "lj-date-badge", text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() });
    const greeting = header.createDiv({ cls: "lj-greeting" });
    greeting.createSpan({ text: "\u4ECA\u5929\uFF0C\u597D\u597D" });
    greeting.createSpan({ cls: "lj-greeting-accent", text: "\u8BB0\u5F55\u81EA\u5DF1" });
  }

  private buildSoftHeader(root: HTMLElement) {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekDays = ["\u661F\u671F\u65E5","\u661F\u671F\u4E00","\u661F\u671F\u4E8C","\u661F\u671F\u4E09","\u661F\u671F\u56DB","\u661F\u671F\u4E94","\u661F\u671F\u516D"];
    const header = root.createDiv({ cls: "lj-header" });
    const toprow = header.createDiv({ cls: "lj-header-toprow" });
    const brand = toprow.createDiv({ cls: "lj-brand" });
    brand.createDiv({ cls: "lj-brand-dot" });
    brand.createSpan({ text: "LIFE JOURNAL" });
    toprow.createDiv({ cls: "lj-streak-pill", text: "\u2726 \u4ECA\u65E5\u8BB0\u5F55" });
    const dateRow = header.createDiv({ cls: "lj-date-row" });
    dateRow.createSpan({ cls: "lj-date-large", text: `${m}\u6708${day}\u65E5` });
    dateRow.createSpan({ cls: "lj-date-sub", text: weekDays[d.getDay()] });
  }

  private buildTabsAndContent(root: HTMLElement, style: UIStyle) {
    const tabs: { key: keyof SectionMapping; emoji: string; label: string }[] = [
      { key: "mood",     emoji: "\u2728",        label: "\u5FC3\u60C5" },
      { key: "present",  emoji: "\u{1F4DD}",     label: "\u8BB0\u5F55" },
      { key: "thoughts", emoji: "\u{1F4AD}",     label: "\u60F3\u6CD5" },
      { key: "plans",    emoji: "\u{1F5D3}",     label: "\u8BA1\u5212" },
    ];
    const tabBar = root.createDiv({ cls: "lj-tab-bar" });
    tabs.forEach(tab => {
      const btn = tabBar.createDiv({ cls: `lj-tab ${this.activeTab === tab.key ? "active" : ""}` });
      btn.createDiv({ cls: "lj-tab-emoji", text: tab.emoji });
      btn.createDiv({ text: tab.label });
      btn.addEventListener("click", () => { if (this.activeTab !== tab.key) { this.activeTab = tab.key; this.buildUI(); } });
    });
    const content = root.createDiv({ cls: "lj-content lj-content-scroll" });
    this.renderTabContent(content, this.activeTab, style);
  }

  private renderTabContent(container: HTMLElement, tab: keyof SectionMapping, style: UIStyle) {
    if (tab === "mood") this.renderMoodTab(container, style);
    else if (tab === "plans") this.renderPlansTab(container, style);
    else this.renderTextTab(container, tab, style);
  }

  private mountTagPreview(inputEl: HTMLTextAreaElement | HTMLInputElement, previewEl: HTMLElement) {
    const handler = () => {
      const tags = extractInlineTags(inputEl.value);
      previewEl.empty();
      previewEl.toggleClass("has-tags", tags.length > 0);
      if (tags.length === 0) return;
      previewEl.createDiv({ cls: "lj-tag-preview-label", text: "\u5DF2\u8BC6\u522B\u6807\u7B7E" });
      const list = previewEl.createDiv({ cls: "lj-tag-preview-list" });
      tags.forEach(tag => { list.createDiv({ cls: "lj-tag-chip", text: tag }); });
    };
    inputEl.addEventListener("input", handler);
    handler();
  }

  /** 在 textarea 上监听图片粘贴，保存到 vault 并插入 ![[image.png]] 引用 */
  private setupImageSupport(textarea: HTMLTextAreaElement, wrap: HTMLElement) {
    // 粘贴上传
    textarea.addEventListener("paste", async (evt: ClipboardEvent) => {
      const files = evt.clipboardData?.files;
      if (!files || files.length === 0) return;

      let hasImage = false;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        evt.preventDefault();
        hasImage = true;
        await this.saveImageToVault(file, textarea);
      }
    });

    // 文件选择上传
    const fileInput = wrap.createEl("input", {
      cls: "lj-img-file-input",
      attr: { type: "file", accept: "image/*", multiple: "true" },
    });
    fileInput.style.display = "none";
    fileInput.addEventListener("change", async () => {
      const files = fileInput.files;
      if (!files) return;
      for (const file of files) {
        await this.saveImageToVault(file, textarea);
      }
      fileInput.value = ""; // 清空以便再次选择
    });

    // 上传按钮行
    const imgBar = wrap.createDiv({ cls: "lj-img-bar" });
    const uploadBtn = imgBar.createDiv({ cls: "lj-img-upload-btn", text: "\u{1F4F7}" });
    const hintText = imgBar.createDiv({ cls: "lj-img-hint", text: "\u652F\u6301\u7C98\u8D34\u6216\u70B9\u6B64\u4E0A\u4F20\u56FE\u7247" });
    uploadBtn.addEventListener("click", () => fileInput.click());
  }

  private async saveImageToVault(file: File, textarea: HTMLTextAreaElement) {
    try {
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}`;
      const ext = file.name.split(".").pop() || "png";
      const fileName = `lj-img-${ts}.${ext}`;

      const diaryFolder = this.plugin.settings.diaryFolder.trim().replace(/\/$/, "");
      const imagePath = `${diaryFolder}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      await this.app.vault.createBinary(imagePath, uint8);

      const insertText = `\n![[${fileName}]]\n`;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);
      textarea.value = before + insertText + after;
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      textarea.dispatchEvent(new Event("input"));

      new Notice(`\u{1F4F7} 图片已添加：${fileName}`);
    } catch (e) {
      new Notice("图片保存失败，请检查日记目录设置");
      console.error("Life Journal: 图片保存失败", e);
    }
  }

  private renderMoodTab(container: HTMLElement, _style: UIStyle) {
    const mobile = isMobile();
    const moods = mobile ? [...MOODS_MOBILE] : [...MOODS_PC];
    const moodGrid = container.createDiv({ cls: `lj-mood-grid ${mobile ? "lj-mood-grid-mobile" : ""}` });
    moods.forEach(mood => {
      const pill = moodGrid.createDiv({ cls: `lj-mood-pill ${this.selectedMood === mood.key ? "selected" : ""}` });
      pill.createDiv({ text: mood.emoji });
      pill.createEl("span", { text: mood.label });
      pill.addEventListener("click", () => {
        this.selectedMood = this.selectedMood === mood.key ? null : mood.key;
        moodGrid.querySelectorAll(".lj-mood-pill").forEach(p => p.removeClass("selected"));
        if (this.selectedMood) pill.addClass("selected");
      });
    });
    const wrap = container.createDiv({ cls: "lj-input-wrap" });
    const textarea = wrap.createEl("textarea", {
      cls: `lj-textarea lj-mood-textarea ${mobile ? "lj-textarea-mobile" : ""}`,
      attr: { placeholder: "\u8BF4\u8BF4\u4F60\u6B64\u65F6\u7684\u611F\u53D7\u2026", rows: mobile ? "2" : "3" },
    });
    const tagPreview = wrap.createDiv({ cls: "lj-tag-preview" });
    this.mountTagPreview(textarea, tagPreview);
    this.setupImageSupport(textarea, wrap);
    const saveBtn = wrap.createDiv({ cls: "lj-save-btn lj-save-btn-sticky" });
    saveBtn.createDiv({ cls: "lj-btn-icon", text: "\u2728" });
    saveBtn.createDiv({ cls: "lj-btn-text", text: "\u8BB0\u5F55\u5FC3\u60C5" });
    textarea.addEventListener("focus", () => {
      setTimeout(() => saveBtn.scrollIntoView({ block: "nearest", behavior: "smooth" }), 350);
    });
    saveBtn.addEventListener("click", async () => {
      if (!this.selectedMood) { new Notice("\u8BF7\u5148\u5728\u4E0A\u65B9\u9009\u62E9\u5FC3\u60C5\uFF5E"); return; }
      const mood = moods.find(m => m.key === this.selectedMood);
      if (!mood) return;
      const text = textarea.value.trim();
      const content = text ? `${mood.emoji} ${mood.label}  \u2014 ${text}` : `${mood.emoji} ${mood.label}`;
      saveBtn.addClass("loading");
      try {
        await appendToSection(this.app, this.plugin.settings, "mood", content);
        new Notice("\u2726 \u5FC3\u60C5\u5DF2\u8BB0\u5F55");
        textarea.value = "";
        textarea.dispatchEvent(new Event("input"));
        this.selectedMood = null;
        this.buildUI();
      } catch (e) { new Notice("\u8BB0\u5F55\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u65E5\u8BB0\u76EE\u5F55\u8BBE\u7F6E"); }
      finally { saveBtn.removeClass("loading"); }
    });
  }

  private renderTextTab(container: HTMLElement, tab: "present" | "thoughts", _style: UIStyle) {
    const mobile = isMobile();
    const config = { present: { placeholder: "\u6B64\u523B\uFF0C\u53D1\u751F\u4E86\u4EC0\u4E48\u2026", icon: "\u{1F4DD}" }, thoughts: { placeholder: "\u8111\u6D77\u4E2D\u6709\u4EC0\u4E48\u5FF5\u5934\u2026", icon: "\u{1F4AD}" } }[tab];
    const wrap = container.createDiv({ cls: "lj-input-wrap" });
    const textarea = wrap.createEl("textarea", {
      cls: `lj-textarea ${mobile ? "lj-textarea-mobile" : ""}`,
      attr: { placeholder: config.placeholder, rows: mobile ? "4" : "6" },
    });
    const tagPreview = wrap.createDiv({ cls: "lj-tag-preview" });
    this.mountTagPreview(textarea, tagPreview);
    this.setupImageSupport(textarea, wrap);
    const saveBtn = wrap.createDiv({ cls: "lj-save-btn lj-save-btn-sticky" });
    saveBtn.createDiv({ cls: "lj-btn-icon", text: config.icon });
    saveBtn.createDiv({ cls: "lj-btn-text", text: "\u4FDD\u5B58\u8BB0\u5F55" });
    textarea.addEventListener("focus", () => {
      setTimeout(() => saveBtn.scrollIntoView({ block: "nearest", behavior: "smooth" }), 350);
    });
    saveBtn.addEventListener("click", async () => {
      const text = textarea.value.trim();
      if (!text) { new Notice("\u8BF7\u5148\u8F93\u5165\u5185\u5BB9\uFF5E"); return; }
      saveBtn.addClass("loading");
      try {
        await appendToSection(this.app, this.plugin.settings, tab, text);
        new Notice("\u2726 \u5DF2\u8BB0\u5F55");
        textarea.value = "";
        textarea.dispatchEvent(new Event("input"));
      } catch (e) { new Notice("\u8BB0\u5F55\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u65E5\u8BB0\u76EE\u5F55\u8BBE\u7F6E"); }
      finally { saveBtn.removeClass("loading"); }
    });
  }

  private renderPlansTab(container: HTMLElement, _style: UIStyle) {
    const addRow = container.createDiv({ cls: "lj-todo-add-row" });
    const input = addRow.createEl("input", { cls: "lj-todo-input", attr: { type: "text", placeholder: "添加待办（如：本周五完成报告）" } });
    const addBtn = addRow.createDiv({ cls: "lj-todo-add-btn", text: "+" });
    // 自动识别日期的提示区
    const dateHint = container.createDiv({ cls: "lj-date-hint" });
    input.addEventListener("input", () => {
      const result = extractDateFromText(input.value);
      if (result.date) {
        dateHint.setText(`📅 已识别：${formatDueDate(result.date)}（${result.date}）`);
        dateHint.addClass("visible");
      } else {
        dateHint.setText("");
        dateHint.removeClass("visible");
      }
    });
    const tagPreview = container.createDiv({ cls: "lj-tag-preview lj-tag-preview-plans" });
    this.mountTagPreview(input, tagPreview);
    const todoList = container.createDiv({ cls: "lj-todo-list" });
    this.renderTodoItems(todoList);
    const addItem = () => {
      const rawText = input.value.trim();
      if (!rawText) return;
      const { date, text } = extractDateFromText(rawText);
      this.todoItems.push({ text: text || rawText, done: false, lineIndex: -1, dueDate: date, createdAt: moment().format("YYYY-MM-DD") });
      input.value = "";
      dateHint.setText("");
      dateHint.removeClass("visible");
      input.dispatchEvent(new Event("input"));
      this.renderTodoItems(todoList);
    };
    addBtn.addEventListener("click", addItem);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") addItem(); });
    const clearRow = container.createDiv({ cls: "lj-todo-clear-row" });
    const clearBtn = clearRow.createDiv({ cls: "lj-todo-clear-btn", text: "清除已完成" });
    clearBtn.addEventListener("click", () => { this.todoItems = this.todoItems.filter(t => !t.done); this.renderTodoItems(todoList); });
    const saveBtn = container.createDiv({ cls: "lj-save-btn lj-save-btn-sticky" });
    saveBtn.createDiv({ cls: "lj-btn-icon", text: "\u{1F5D3}" });
    saveBtn.createDiv({ cls: "lj-btn-text", text: "保存计划" });
    input.addEventListener("focus", () => {
      setTimeout(() => saveBtn.scrollIntoView({ block: "nearest", behavior: "smooth" }), 350);
    });
    saveBtn.addEventListener("click", async () => {
      if (this.todoItems.length === 0) { new Notice("请先添加待办事项～"); return; }
      const sorted = [...this.todoItems].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const lines = [
        `**${timeStr} 计划**`,
        ...sorted.map(t => {
          let line = `- [${t.done ? "x" : " "}] ${t.text}`;
          if (t.dueDate) line += ` 📅 ${t.dueDate}`;
          return line;
        }),
      ];
      saveBtn.addClass("loading");
      try {
        await appendToSection(this.app, this.plugin.settings, "plans", lines.join("\n"));
        new Notice("✦ 计划已记录");
        this.todoItems = [];
        this.renderTodoItems(todoList);
      } catch (e) { new Notice("记录失败，请检查日记目录设置"); }
      finally { saveBtn.removeClass("loading"); }
    });
  }

  private renderTodoItems(container: HTMLElement) {
    container.empty();
    if (this.todoItems.length === 0) {
      container.createDiv({ cls: "lj-todo-empty", text: "\u6682\u65E0\u5F85\u529E\uFF0C\u5728\u4E0A\u65B9\u8F93\u5165\u540E\u6309\u56DE\u8F66\u6DFB\u52A0\uFF5E" });
      return;
    }
    this.todoItems.forEach((todo, i) => {
      const item = container.createDiv({ cls: `lj-todo-item ${todo.done ? "done" : ""}` });
      const cb = item.createEl("input", { cls: "lj-todo-checkbox", attr: { type: "checkbox" } });
      cb.checked = todo.done;
      cb.addEventListener("change", () => {
        this.todoItems[i].done = cb.checked;
        item.toggleClass("done", cb.checked);
        const txt = item.querySelector(".lj-todo-text");
        if (txt) txt.toggleClass("strikethrough", cb.checked);
      });
      const textEl = item.createDiv({ cls: `lj-todo-text ${todo.done ? "strikethrough" : ""}` });
      textEl.createSpan({ text: todo.text });
      if (todo.dueDate) {
        textEl.createSpan({ cls: `lj-todo-due ${moment(todo.dueDate).isBefore(moment(), "day") ? "overdue" : ""}`, text: `📅 ${formatDueDate(todo.dueDate)}` });
      }
      item.createDiv({ cls: "lj-todo-del", text: "\xD7" }).addEventListener("click", () => {
        this.todoItems.splice(i, 1);
        this.renderTodoItems(container);
      });
    });
  }
}
