import { App, TFile, normalizePath } from "obsidian";
import type { LifeJournalSettings, SectionMapping } from "./settings";

/** 从文本中提取行内标签 */
function extractInlineTags(text: string): string[] {
  const regex = /(^|[\s\u3000"'`([{<\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001\uFF08\uFF09\u3010\u3011\u300A\u300B\u300C\u300D\u300E\u300F,.;!?])#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu;
  const tags: string[] = [];
  let m;
  while ((m = regex.exec(text)) !== null) { tags.push(m[2]); }
  return [...new Set(tags)];
}

/** 单条记录的类型 */
export type EntryType = "mood" | "present" | "thoughts" | "plans";

/** 一条日记内容条目 */
export interface JournalEntry {
  id: string;           // 唯一ID，用于任务同步定位
  type: EntryType;
  date: string;         // YYYY-MM-DD
  time?: string;        // HH:mm（从行内容中提取）
  text: string;         // 正文内容
  todos?: TodoItem[];   // 仅 plans 类型有
  tags?: string[];      // 行内标签（#标签）
  filePath: string;     // 来源文件路径
  rawLineIndex?: number; // 在文件中的行号（用于任务回写）
}

/** 计划任务项 */
export interface TodoItem {
  text: string;
  done: boolean;
  lineIndex: number;    // 在文件中的行号（用于精确回写）
  dueDate?: string;     // 截止日期 YYYY-MM-DD
  createdAt?: string;   // 创建日期 YYYY-MM-DD
}

/** 图片扩展名（用于旧链接兼容） */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp"];

/** 按日期分组的条目列表 */
export interface DayGroup {
  date: string;       // YYYY-MM-DD
  dateLabel: string;  // "今天" / "昨天" / "3月25日"
  entries: JournalEntry[];
}

/**
 * 读取 vault 中所有日记文件，解析并返回按日期倒序排列的条目
 */
export async function readAllJournalEntries(
  app: App,
  settings: LifeJournalSettings,
  filterType?: EntryType
): Promise<DayGroup[]> {
  const folder = settings.diaryFolder.trim().replace(/\/$/, "");
  const folderFile = app.vault.getAbstractFileByPath(normalizePath(folder));
  if (!folderFile) return [];

  // 获取所有 .md 文件，按文件名（日期）倒序
  const files = app.vault.getMarkdownFiles()
    .filter(f => f.path.startsWith(normalizePath(folder) + "/"))
    .sort((a, b) => b.basename.localeCompare(a.basename));

  const groups: DayGroup[] = [];

  for (const file of files) {
    const entries = await parseJournalFile(app, file, settings, filterType);
    if (entries.length === 0) continue;

    const date = file.basename; // YYYY-MM-DD
    groups.push({
      date,
      dateLabel: formatDateLabel(date),
      entries,
    });
  }

  return groups;
}

/**
 * 解析单个日记文件，提取所有条目
 */
async function parseJournalFile(
  app: App,
  file: TFile,
  settings: LifeJournalSettings,
  filterType?: EntryType
): Promise<JournalEntry[]> {
  const content = await app.vault.read(file);
  const lines = content.split("\n");
  const entries: JournalEntry[] = [];

  // 建立 section 标题 → EntryType 的映射
  const sectionMap = buildSectionMap(settings.sectionMapping);

  let currentType: EntryType | null = null;
  let currentLines: { text: string; lineIndex: number }[] = [];
  let sectionStartLine = -1;

  const flushSection = () => {
    if (!currentType || currentLines.length === 0) return;
    if (filterType && currentType !== filterType) {
      currentLines = [];
      return;
    }

    if (currentType === "plans") {
      // 计划：按 **HH:mm 计划** 分组
      parsePlanSection(currentLines, currentType, file.path, file.basename, entries);
    } else {
      // 其他：多行合并解析（v3.1.4）
      // 以 "- HH:mm" 开头的行是新条目，其他行续接到上一条
      let lastEntry: JournalEntry | null = null;
      currentLines.forEach(({ text, lineIndex }) => {
        const trimmed = text.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        // 去掉行首 "- " 前缀
        const cleaned = trimmed.replace(/^-\s*/, "");
        // 提取时间
        const timeMatch = cleaned.match(/^(\d{2}:\d{2})\s+(.+)$/);
        if (timeMatch) {
          // 新条目
          const entryText = fixImageLinks(timeMatch[2]);
          const entry: JournalEntry = {
            id: `${file.basename}-${lineIndex}`,
            type: currentType!,
            date: file.basename,
            time: timeMatch[1],
            text: entryText,
            tags: extractInlineTags(entryText),
            filePath: file.path,
            rawLineIndex: lineIndex,
          };
          entries.push(entry);
          lastEntry = entry;
        } else if (lastEntry) {
          // 续行：合并到上一条记录
          const appendText = fixImageLinks(cleaned);
          lastEntry.text += "\n" + appendText;
          // 合并续行的标签
          const newTags = extractInlineTags(appendText);
          if (newTags.length > 0) {
            const existing = lastEntry.tags ?? [];
            lastEntry.tags = [...new Set([...existing, ...newTags])];
          }
        } else {
          // 没有上一条记录兜底创建
          const entryText = fixImageLinks(cleaned);
          const entry: JournalEntry = {
            id: `${file.basename}-${lineIndex}`,
            type: currentType!,
            date: file.basename,
            text: entryText,
            tags: extractInlineTags(entryText),
            filePath: file.path,
            rawLineIndex: lineIndex,
          };
          entries.push(entry);
          lastEntry = entry;
        }
      });
    }
    currentLines = [];
  };

  lines.forEach((line, idx) => {
    // 检测一级标题（# xxx）
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushSection();
      const title = h1Match[1].trim();
      currentType = sectionMap[title] ?? null;
      sectionStartLine = idx;
      return;
    }
    if (currentType !== null) {
      currentLines.push({ text: line, lineIndex: idx });
    }
  });
  flushSection();

  // 按时间倒序排
  entries.sort((a, b) => (b.time ?? "00:00").localeCompare(a.time ?? "00:00"));
  return entries;
}

/**
 * 解析计划区块（可能含多个 **HH:mm 计划** 块）
 */
function parsePlanSection(
  lines: { text: string; lineIndex: number }[],
  type: EntryType,
  filePath: string,
  date: string,
  entries: JournalEntry[]
) {
  let currentHeader: string | null = null;
  let currentTime: string | undefined;
  let currentTodos: TodoItem[] = [];
  let headerLineIndex = -1;

  const flush = () => {
    if (currentTodos.length === 0 && !currentHeader) return;
    // 从所有 todo 文本中收集标签
    const allTodoText = currentTodos.map(t => t.text).join(" ");
    const planTags = extractInlineTags(allTodoText);
    entries.push({
      id: `${date}-plan-${headerLineIndex}`,
      type,
      date,
      time: currentTime,
      text: currentHeader ?? "计划",
      todos: [...currentTodos],
      tags: planTags.length > 0 ? planTags : undefined,
      filePath,
      rawLineIndex: headerLineIndex,
    });
    currentTodos = [];
    currentHeader = null;
    currentTime = undefined;
  };

  lines.forEach(({ text, lineIndex }) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // **HH:mm 计划** 格式的小标题
    const planHeaderMatch = trimmed.match(/^\*\*(\d{2}:\d{2})\s+计划\*\*$/);
    if (planHeaderMatch) {
      flush();
      currentTime = planHeaderMatch[1];
      currentHeader = trimmed.replace(/\*\*/g, "");
      headerLineIndex = lineIndex;
      return;
    }

    // - [ ] 或 - [x] 任务行（v3.1.6：支持截止日期📅）
    const todoMatch = trimmed.match(/^-\s+\[( |x|X)\]\s+(.+)$/);
    if (todoMatch) {
      let todoText = todoMatch[2];
      const done = todoMatch[1].toLowerCase() === "x";
      let dueDate: string | undefined;

      // 解析截止日期（📅 YYYY-MM-DD）
      const dueMatch = todoText.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
      if (dueMatch) {
        dueDate = dueMatch[1];
        todoText = todoText.replace(/📅\s*\d{4}-\d{2}-\d{2}\s*/, "");
      }

      currentTodos.push({
        text: todoText.trim(),
        done,
        lineIndex,
        dueDate,
        createdAt: date,
      });
      return;
    }

    // 其他内容行（没有标题时兜底创建一个）
    if (!currentHeader) {
      currentHeader = "计划";
      headerLineIndex = lineIndex;
    }
  });
  flush();
}

/**
 * 判断链接是否为图片（按扩展名）
 */
function isImageLink(link: string): boolean {
  const ext = link.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.includes(ext);
}

/**
 * 修复旧式图片链接：[[xxx.png]] → ![[xxx.png]]
 * 仅修复内存数据，不修改原文件
 */
export function fixImageLinks(text: string): string {
  // 匹配 [[xxx.ext]] 但不匹配 ![[xxx.ext]]（已有感叹号的不修）
  // 使用负向后瞻 (?<!!) 确保 [[ 前面没有感叹号
  return text.replace(/(?<!!)\[\[([^\[\]]+\.([a-zA-Z]{2,4}))\]\]/g, (match, linkContent, ext) => {
    if (IMAGE_EXTS.includes(ext.toLowerCase())) {
      return `![[${linkContent}]]`;
    }
    return match;
  });
}

/**
 * 将 SectionMapping 的值（标题文字）→ EntryType 的反查表
 */
function buildSectionMap(mapping: SectionMapping): Record<string, EntryType> {
  return {
    [mapping.mood]:     "mood",
    [mapping.present]:  "present",
    [mapping.thoughts]: "thoughts",
    [mapping.plans]:    "plans",
  };
}

/**
 * 格式化日期标签（今天/昨天/N月N日）
 */
function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (dateStr === fmt(today)) return "今天";
  if (dateStr === fmt(yesterday)) return "昨天";

  const match = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (match) return `${parseInt(match[1])}月${parseInt(match[2])}日`;
  return dateStr;
}

/**
 * 将指定任务行的 - [ ] 改写为 - [x]（或反向），回写到日记文件
 */
export async function toggleTodoInFile(
  app: App,
  filePath: string,
  lineIndex: number,
  done: boolean
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(filePath) as TFile | null;
  if (!file) throw new Error(`文件不存在：${filePath}`);

  const content = await app.vault.read(file);
  const lines = content.split("\n");

  if (lineIndex < 0 || lineIndex >= lines.length) return;

  const line = lines[lineIndex];
  if (done) {
    lines[lineIndex] = line.replace(/^(\s*-\s+)\[ \]/, "$1[x]");
  } else {
    lines[lineIndex] = line.replace(/^(\s*-\s+)\[x\]/i, "$1[ ]");
  }

  await app.vault.modify(file, lines.join("\n"));
}
