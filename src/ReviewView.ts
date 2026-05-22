import { MarkdownRenderer, Notice, moment } from "obsidian";
import type LifeJournalPlugin from "./main";
import {
  readAllJournalEntries,
  toggleTodoInFile,
  type DayGroup,
  type JournalEntry,
  type EntryType,
  type TodoItem,
} from "./fileReader";

/** 筛选标签类型（"all" 表示全部） */
type FilterTag = "all" | EntryType;

/** 各类型的配置 */
const TYPE_CONFIG: Record<EntryType, { label: string; emoji: string; colorClass: string }> = {
  mood:     { label: "心情", emoji: "✨", colorClass: "tag-mood" },
  present:  { label: "记录", emoji: "📝", colorClass: "tag-present" },
  thoughts: { label: "想法", emoji: "💭", colorClass: "tag-thought" },
  plans:    { label: "计划", emoji: "🗓", colorClass: "tag-plan" },
};

export class ReviewView {
  private plugin: LifeJournalPlugin;
  private container: HTMLElement;
  private activeFilter: FilterTag = "all";
  private activeInlineTag: string | null = null;
  private isLoading = false;

  constructor(container: HTMLElement, plugin: LifeJournalPlugin) {
    this.container = container;
    this.plugin = plugin;
  }

  /** 渲染整个回顾视图 */
  async render() {
    this.container.empty();
    this.container.addClass("lj-review-root");

    // 类型筛选栏
    this.renderFilterBar();

    // 行内标签筛选状态
    this.renderActiveInlineTagBar();

    // 内容区（滚动）
    const scrollArea = this.container.createDiv({ cls: "lj-review-scroll" });
    this.renderLoadingState(scrollArea);

    // 异步加载数据
    try {
      const groups = await readAllJournalEntries(
        this.plugin.app,
        this.plugin.settings,
        this.activeFilter === "all" ? undefined : this.activeFilter
      );
      const visibleGroups = this.activeInlineTag
        ? this.filterGroupsByInlineTag(groups, this.activeInlineTag)
        : groups;

      scrollArea.empty();
      if (visibleGroups.length === 0) {
        this.renderEmpty(scrollArea);
      } else {
        this.renderGroups(scrollArea, visibleGroups);
      }
    } catch (e) {
      scrollArea.empty();
      scrollArea.createDiv({ cls: "lj-review-empty", text: "读取日记失败，请检查日记目录设置" });
    }
  }

  /** 渲染筛选标签栏 */
  private renderFilterBar() {
    const bar = this.container.createDiv({ cls: "lj-review-filter-bar" });

    const tags: { key: FilterTag; label: string; emoji: string }[] = [
      { key: "all", label: "全部", emoji: "📋" },
      { key: "mood", label: "心情", emoji: "✨" },
      { key: "present", label: "记录", emoji: "📝" },
      { key: "thoughts", label: "想法", emoji: "💭" },
      { key: "plans", label: "计划", emoji: "🗓" },
    ];

    tags.forEach(tag => {
      const btn = bar.createDiv({
        cls: `lj-review-filter-tag ${tag.key === "all" ? "" : `filter-${tag.key}`} ${this.activeFilter === tag.key ? "active" : ""}`,
      });
      btn.createSpan({ text: `${tag.emoji} ${tag.label}` });
      btn.addEventListener("click", () => {
        if (this.activeFilter === tag.key) return;
        this.activeFilter = tag.key;
        this.render();
      });
    });
  }

  /** 渲染当前激活的行内标签筛选 */
  private renderActiveInlineTagBar() {
    if (!this.activeInlineTag) return;

    const bar = this.container.createDiv({ cls: "lj-review-active-tag-bar" });
    bar.createSpan({ cls: "lj-review-active-tag-label", text: "标签筛选" });

    const activeTag = bar.createDiv({ cls: "lj-review-inline-tag active" });
    activeTag.createSpan({ text: this.activeInlineTag });

    const clearBtn = bar.createDiv({ cls: "lj-review-clear-tag", text: "清除" });
    clearBtn.addEventListener("click", () => {
      this.activeInlineTag = null;
      this.render();
    });
  }

  /** 渲染加载中状态 */
  private renderLoadingState(container: HTMLElement) {
    const loading = container.createDiv({ cls: "lj-review-loading" });
    loading.createDiv({ cls: "lj-review-loading-dot" });
    loading.createDiv({ cls: "lj-review-loading-dot" });
    loading.createDiv({ cls: "lj-review-loading-dot" });
  }

  /** 渲染空状态 */
  private renderEmpty(container: HTMLElement) {
    const empty = container.createDiv({ cls: "lj-review-empty" });
    empty.createDiv({ cls: "lj-review-empty-icon", text: "📖" });
    if (this.activeInlineTag) {
      empty.createDiv({ cls: "lj-review-empty-title", text: "这个标签下还没有记录" });
      empty.createDiv({ cls: "lj-review-empty-sub", text: `试试清除标签筛选，或先记录一条包含 ${this.activeInlineTag} 的内容` });
      return;
    }

    empty.createDiv({ cls: "lj-review-empty-title", text: "还没有记录" });
    empty.createDiv({ cls: "lj-review-empty-sub", text: "切换到「记录」开始写第一篇日记吧" });
  }

  /** 渲染日期分组列表 */
  private renderGroups(container: HTMLElement, groups: DayGroup[]) {
    groups.forEach(group => {
      const groupEl = container.createDiv({ cls: "lj-review-date-group" });

      // 日期标签
      const dateLabel = groupEl.createDiv({ cls: "lj-review-date-label" });
      dateLabel.createSpan({ text: group.dateLabel });
      dateLabel.createSpan({ cls: "lj-review-date-full", text: group.date });

      // 该日期下的所有卡片
      group.entries.forEach(entry => {
        this.renderCard(groupEl, entry);
      });
    });
  }

  /** 渲染单张内容卡片 */
  private renderCard(container: HTMLElement, entry: JournalEntry) {
    const card = container.createDiv({ cls: "lj-review-card" });

    // 卡片头部
    const header = card.createDiv({ cls: "lj-review-card-header" });
    const typeConf = TYPE_CONFIG[entry.type];

    const tagEl = header.createDiv({ cls: `lj-review-card-tag ${typeConf.colorClass}` });
    tagEl.createSpan({ text: `${typeConf.emoji} ${typeConf.label}` });

    if (entry.time) {
      header.createDiv({ cls: "lj-review-card-time", text: entry.time });
    }

    // 卡片内容（v3.1.4：多行内容换行渲染）
    if (entry.type === "plans" && entry.todos) {
      this.renderTodoCard(card, entry);
    } else {
      const textWrap = card.createDiv({ cls: "lj-review-card-text markdown-rendered" });
      // v3.1.4：多行内容用 pre-wrap 保留换行
      if (entry.text.includes("\n")) {
        textWrap.style.whiteSpace = "pre-wrap";
      }
      void MarkdownRenderer.render(this.plugin.app, entry.text, textWrap, entry.filePath, this.plugin);
    }

    this.renderEntryTags(card, entry.tags);
  }

  /** 渲染计划任务卡片（含可勾选 checkbox） */
  private renderTodoCard(card: HTMLElement, entry: JournalEntry) {
    if (!entry.todos || entry.todos.length === 0) return;

    const todoList = card.createDiv({ cls: "lj-review-todo-list" });

    entry.todos.forEach(todo => {
      const item = todoList.createDiv({ cls: `lj-review-todo-item ${todo.done ? "done" : ""}` });

      // 自定义 checkbox
      const checkbox = item.createDiv({
        cls: `lj-review-checkbox ${todo.done ? "checked" : ""}`,
      });

      const textEl = item.createDiv({
        cls: `lj-review-todo-text ${todo.done ? "done" : ""}`,
      });
      textEl.createSpan({ text: todo.text });
      // v3.1.4：截止日期标签
      if (todo.dueDate) {
        const overdue = this.isTodoOverdue(todo.dueDate);
        const dueTag = textEl.createSpan({
          cls: `lj-review-due ${overdue ? "overdue" : ""}`,
          text: overdue ? "⚠️过期" : `📅 ${this.formatTodoDue(todo.dueDate)}`,
        });
      }

      // 点击事件
      const toggle = async () => {
        if (this.isLoading) return;
        this.isLoading = true;
        const newDone = !todo.done;
        try {
          await toggleTodoInFile(this.plugin.app, entry.filePath, todo.lineIndex, newDone);
          todo.done = newDone;
          checkbox.toggleClass("checked", newDone);
          textEl.toggleClass("done", newDone);
          item.toggleClass("done", newDone);
          new Notice(newDone ? "✅ 任务完成" : "↩️ 已取消完成");
        } catch (e) {
          new Notice("同步失败，请检查日记文件");
        } finally {
          this.isLoading = false;
        }
      };

      checkbox.addEventListener("click", toggle);
      textEl.addEventListener("click", toggle);
    });

    // 显示进度
    const doneCount = entry.todos.filter(t => t.done).length;
    const total = entry.todos.length;
    if (total > 0) {
      const progress = card.createDiv({ cls: "lj-review-todo-progress" });
      progress.createSpan({ text: `${doneCount}/${total} 已完成` });
      const bar = progress.createDiv({ cls: "lj-review-progress-bar" });
      const fill = bar.createDiv({ cls: "lj-review-progress-fill" });
      fill.style.width = `${Math.round((doneCount / total) * 100)}%`;
    }
  }

  /** 渲染识别到的行内标签 */
  private renderEntryTags(container: HTMLElement, tags: string[] | undefined) {
    if (!tags || !tags.length) return;

    const row = container.createDiv({ cls: "lj-review-entry-tags" });
    tags.forEach(tag => {
      const chip = row.createDiv({
        cls: `lj-review-inline-tag ${this.activeInlineTag === tag ? "active" : ""}`,
      });
      chip.createSpan({ text: tag });
      chip.addEventListener("click", (evt) => {
        evt.stopPropagation();
        this.activeInlineTag = this.activeInlineTag === tag ? null : tag;
        this.render();
      });
    });
  }

  /** 根据行内标签二次过滤回顾结果 */
  private filterGroupsByInlineTag(groups: DayGroup[], tag: string): DayGroup[] {
    return groups
      .map(group => ({
        ...group,
        entries: group.entries.filter(entry => entry.tags?.includes(tag)),
      }))
      .filter(group => group.entries.length > 0);
  }

  // ════════════════════════════════════════════════
  // v3.1.4 工具方法
  // ════════════════════════════════════════════════

  /** 格式化截止日期为友好显示 */
  private formatTodoDue(dateStr: string): string {
    const due = moment(dateStr).startOf("day");
    const today = moment().startOf("day");
    const diff = due.diff(today, "day");
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    if (diff < 0) return `${Math.abs(diff)}天前`;
    if (diff <= 7) return `${diff}天后`;
    return `${due.month() + 1}月${due.date()}日`;
  }

  /** 判断待办是否过期 */
  private isTodoOverdue(dateStr: string): boolean {
    return moment(dateStr).isBefore(moment(), "day");
  }
}
