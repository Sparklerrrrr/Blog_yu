/**
 * 档案阵列的数据层（博客版）。
 *
 * 原项目（RhineLabUI）在这里读取固定的 content/archives.json：五列、每列八份。
 * 博客的文章数量和分类都会变，所以改为运行时由页面注入（setArchiveData），
 * 并且允许任意列数、每列任意份数——阵列本身是无限循环的，内容按列/行取模铺满。
 *
 * 阵列坐标约定沿用原项目：lane = 列号（0 起），row = 12 + 列内序号。
 */
export interface ArchiveHeading {
  depth: number;
  text: string;
  slug: string;
}

export interface ArchiveRecord {
  /** 稳定编号，如 Y-001：按发布时间从旧到新编号，新文章不会打乱旧编号 */
  id: string;
  /** 编号的数字部分（标签上的 NO.001） */
  no: number;
  slug: string;
  url: string;
  title: string;
  /** 摘要（frontmatter 的 description，缺省时取正文开头） */
  abstract: string;
  /** 分类 id（tech / philosophy / thoughts），同时也是所在列 */
  category: string;
  categoryZh: string;
  categoryEn: string;
  date: string;
  updated: string;
  minutes: number;
  words: number;
  tags: string[];
  pin: boolean;
  headings: ArchiveHeading[];
  /** 相关文章（records 下标） */
  related: number[];
}

export const records: ArchiveRecord[] = [];
/** 从左到右的列（分类 id）；只包含至少有一篇文章的分类 */
export const archiveColumns: string[] = [];
const columns: number[][] = [];

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export function setArchiveData(list: ArchiveRecord[], columnOrder: string[]) {
  records.length = 0;
  records.push(...list);
  archiveColumns.length = 0;
  columns.length = 0;
  for (const category of columnOrder) {
    const files = records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => record.category === category)
      .map(({ index }) => index);
    if (!files.length) continue;
    archiveColumns.push(category);
    columns.push(files);
  }
}

export function columnFiles(lane: number): number[] {
  return columns[lane] ?? [];
}

export function fileLocation(index: number) {
  const lane = Math.max(0, archiveColumns.indexOf(records[index].category));
  const row = 12 + columnFiles(lane).indexOf(index);
  return { lane, row, slot: lane * 32 + row };
}

export function fileAtSlot(slot: number) {
  const lane = Math.min(columns.length - 1, Math.max(0, Math.floor(slot / 32)));
  const files = columnFiles(lane);
  return files[Math.max(0, Math.min(files.length - 1, (slot % 32) - 12))];
}

/** 行方向的内容周期：各列份数的最小公倍数（长时间浏览后重置坐标时用） */
export function rowPeriod() {
  return columns.reduce((period, files) => (period * files.length) / gcd(period, files.length), 1);
}
