import { App, TFile, normalizePath, moment } from "obsidian";
import type { LifeJournalSettings, SectionMapping } from "./settings";

/**
 * 获取今日日记文件路径
 */
export function getDiaryPath(settings: LifeJournalSettings): string {
  const date = moment().format(settings.dateFormat);
  const folder = settings.diaryFolder.trim().replace(/\/$/, "");
  return normalizePath(`${folder}/${date}.md`);
}

/**
 * 确保目录存在
 */
async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (normalized === "." || normalized === "") return;
  const exists = app.vault.getAbstractFileByPath(normalized);
  if (!exists) {
    await app.vault.createFolder(normalized);
  }
}

/**
 * 格式化时间戳
 */
function getTimestamp(): string {
  return moment().format("HH:mm");
}

/**
 * 向日记的指定 section（# 标题）追加内容
 * 如果 section 不存在则在末尾新建
 */
export async function appendToSection(
  app: App,
  settings: LifeJournalSettings,
  sectionKey: keyof SectionMapping,
  content: string
): Promise<void> {
  const sectionTitle = settings.sectionMapping[sectionKey];
  const diaryPath = getDiaryPath(settings);
  const folderPath = settings.diaryFolder.trim().replace(/\/$/, "");

  // 确保文件夹存在
  await ensureFolder(app, folderPath);

  let file = app.vault.getAbstractFileByPath(diaryPath) as TFile | null;
  const timestamp = getTimestamp();

  // 计划/待办内容已经是格式化的 Markdown（- [ ] / - [x]），直接写入，不加外层 bullet
  // 其他 section 用 "- HH:mm 内容" 格式
  const isRawContent = sectionKey === "plans";
  const entryLine = isRawContent
    ? content.trim()
    : `- ${timestamp} ${content}`;

  if (!file) {
    // 新建日记文件
    const date = moment().format(settings.dateFormat);
    const initial = `# ${date}\n\n# ${sectionTitle}\n\n${entryLine}\n`;
    file = await app.vault.create(diaryPath, initial);
    return;
  }

  // 读取现有内容
  let rawContent = await app.vault.read(file);

  // 查找 section
  const sectionRegex = new RegExp(`(^# ${escapeRegex(sectionTitle)}\\s*$)`, "m");
  const match = sectionRegex.exec(rawContent);

  // 多行内容（plans）前后需要空行确保 Markdown 正确解析
  const separator = isRawContent ? "\n\n" : "\n";

  if (match) {
    // Section 存在：找到下一个 # 标题或文件末尾，在其前插入
    const sectionStart = match.index + match[0].length;
    const afterSection = rawContent.slice(sectionStart);
    // 查找下一个一级标题
    const nextH1 = afterSection.search(/\n^# /m);

    if (nextH1 === -1) {
      // 追加到文件末尾
      rawContent = rawContent.trimEnd() + separator + entryLine + "\n";
    } else {
      const insertPos = sectionStart + nextH1;
      rawContent = rawContent.slice(0, insertPos) + separator + entryLine + rawContent.slice(insertPos);
    }
  } else {
    // Section 不存在：追加新 section
    rawContent = rawContent.trimEnd() + `\n\n# ${sectionTitle}\n\n${entryLine}\n`;
  }

  await app.vault.modify(file, rawContent);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
