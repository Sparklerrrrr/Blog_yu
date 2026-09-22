import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

/**
 * ============ 下载资源（唯一数据源） ============
 * 加资源两步：
 *   1. 把文件放进 public/resources/（文件名建议 小写-连字符）
 *   2. 在下面 RAW_RESOURCES 加一行（url 填 /resources/文件名）
 * 大小与 SHA256 校验值会在构建时自动从磁盘派生，无需手动维护；
 * 文件缺失或手动声明的 size 与实际不符会在构建日志里警告。
 */

export interface Resource {
  name: string;
  desc: string;
  category: ResourceCategory;
  tags: string[];
  /** 下载链接（文件放 public/resources/ 下） */
  url: string;
  /** 更新日期 YYYY-MM-DD（排序与 NEW 角标依据） */
  date: string;
  /** 版本号（可选，显示在卡片上） */
  version?: string;
  /** 手动声明的大小（可选；缺省时自动读取磁盘） */
  size?: string;
}

/** 分类元信息 */
export const RESOURCE_CATEGORIES = {
  code: { en: 'CODE', zh: '源码' },
  docs: { en: 'DOCS', zh: '文档' },
} as const;

export type ResourceCategory = keyof typeof RESOURCE_CATEGORIES;

/** 最近多少天内更新的资源显示 NEW 角标 */
const NEW_WINDOW_DAYS = 7;
/** 超过该体积的文件跳过 SHA256 计算，避免拖慢构建 */
const SHA256_MAX_BYTES = 64 * 1024 * 1024;

const RAW_RESOURCES: Resource[] = [
  {
    name: 'BLOG_YU 博客源码',
    desc: '本站完整源码（Astro 7 + 冰川蓝设计系统），pnpm install && pnpm dev 即可运行。',
    category: 'code',
    tags: ['Astro', '源码', '博客'],
    url: '/resources/blog-yu-source-v2.2.0.zip',
    date: '2026-09-22',
    version: '2.2.0',
  },
  {
    name: 'BLOG_YU 风格设计笔记',
    desc: '本站设计研究全记录：鹰角/方舟风格笔记、design tokens、施工蓝图与官网设计报告。',
    category: 'docs',
    tags: ['设计', '笔记', '方舟'],
    url: '/resources/design-notes.zip',
    date: '2026-08-15',
    size: '18 KB',
  },
  {
    name: 'DeepSeek Harness 完整源码',
    desc: 'AI 智能体开发框架 DeepSeek Harness 的完整源码存档（GitHub master 分支打包），含 agents / website 等全部模块。',
    category: 'code',
    tags: ['AI', '源码', '框架'],
    url: '/resources/deepseek-harness-master.zip',
    date: '2026-08-16',
    size: '17.6 MB',
  },
];

// ---- 派生工具 ----

/** 解析手动声明的 size 字段，统一折算成 KB */
const toKB = (size?: string): number => {
  const m = size?.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
  if (!m) return 0;
  const unit = m[2].toUpperCase();
  const mul = unit === 'B' ? 1 / 1024 : unit === 'MB' ? 1024 : unit === 'GB' ? 1024 * 1024 : 1;
  return parseFloat(m[1]) * mul;
};

/** 字节 → 人类可读（与站点其它地方的口径一致） */
export function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return String(Math.round(bytes / 102.4) / 10) + ' KB';
  return bytes + ' B';
}

// ---- 构建时派生：真实大小 / SHA256 / NEW 角标 ----

export interface ResourceMeta extends Resource {
  /** 磁盘真实大小（人类可读） */
  sizeText: string;
  /** 磁盘真实字节数（排序用） */
  sizeBytes: number;
  /** 完整 SHA256 校验值（文件缺失或超大时为空串） */
  sha256: string;
  /** 近 NEW_WINDOW_DAYS 天内更新 */
  isNew: boolean;
}

const deriveMeta = (r: Resource): ResourceMeta => {
  const file = 'public' + r.url;
  let sizeBytes = 0;
  let sha256 = '';
  if (existsSync(file)) {
    sizeBytes = statSync(file).size;
    if (sizeBytes > 0 && sizeBytes <= SHA256_MAX_BYTES) {
      sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
    }
  } else {
    console.warn('[resources] ⚠ 找不到资源文件 public' + r.url + '（' + r.name + '）');
  }

  // 手动声明的 size 与磁盘实际相差过大时提示（>5KB 且 >10%）
  if (r.size && sizeBytes > 0) {
    const declared = Math.round(toKB(r.size));
    const actual = Math.round(sizeBytes / 1024);
    if (Math.abs(declared - actual) > Math.max(5, actual * 0.1)) {
      console.warn(
        '[resources] ⚠ ' + r.name + ' 声明的 size（' + r.size + '）与磁盘实际（' + humanSize(sizeBytes) + '）不符，已按实际显示'
      );
    }
  }

  const updatedAt = new Date(r.date + 'T00:00:00').getTime();
  const isNew = Number.isFinite(updatedAt) && Date.now() - updatedAt <= NEW_WINDOW_DAYS * 86400000;

  return { ...r, sizeText: humanSize(sizeBytes), sizeBytes, sha256, isNew };
};

/** 资源列表（已附加磁盘派生信息；页面与统计的唯一来源） */
export const RESOURCES: ResourceMeta[] = RAW_RESOURCES.map(deriveMeta);

/** 板块统计（页头与统计磁贴用） */
export const RESOURCE_STATS = {
  total: RESOURCES.length,
  totalBytes: RESOURCES.reduce((sum, r) => sum + r.sizeBytes, 0),
  totalSizeText: humanSize(RESOURCES.reduce((sum, r) => sum + r.sizeBytes, 0)),
  /** 分类 → 数量 */
  byCategory: RESOURCES.reduce<Record<string, number>>((m, r) => {
    m[r.category] = (m[r.category] ?? 0) + 1;
    return m;
  }, {}),
  /** 最新更新时间（倒序取第一条的日期） */
  latestDate: [...RESOURCES].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.date ?? '—',
  /** NEW 角标数量 */
  newCount: RESOURCES.filter((r) => r.isNew).length,
};
