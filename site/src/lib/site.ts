import { getCollection } from 'astro:content';

/** 站点元信息 */
export const SITE = {
  en: 'BLOG_YU',
  zh: '家玉的小站',
  author: 'Yu',
  description: '记录 · 思考 · 建造 —— Yu 的个人博客',
  coords: '31.2304°N 121.4737°E', // 装饰坐标（上海）
} as const;

/** 分类元信息（与 design-system.css 中的 --cat-* 对应） */
export const CATEGORIES = {
  tech: { en: 'TECH', zh: '技术', color: '#7ec8e3' },
  life: { en: 'LIFE', zh: '生活', color: '#fdf900' },
  thoughts: { en: 'THOUGHTS', zh: '思考', color: '#f7dcf0' },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

/** 按日期倒序返回已发布文章 */
export async function getPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 粗略阅读时长（分钟）：中文按 400 字/分钟，英文按 200 词/分钟 */
export function readingTime(body?: string): number {
  if (!body) return 1;
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}
