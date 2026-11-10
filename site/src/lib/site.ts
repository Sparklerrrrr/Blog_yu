import { getCollection, type CollectionEntry } from 'astro:content';

/** 站点元信息 */
export const SITE = {
  en: 'BLOG_YU',
  zh: '家玉的小站',
  /** 标签页标题（<title>） */
  tabTitle: '家玉的博客',
  author: 'Yu',
  description: '记录 · 思考 · 建造 —— Yu 的个人博客',
  coords: '31.2304°N 121.4737°E', // 装饰坐标（上海）
  /** 站点根地址：RSS / sitemap / canonical / OpenGraph 用；上线后按实际域名修改 */
  url: 'https://www.sparklerrr.cn',
  /** 联系邮箱（联系页与友链申请区共用） */
  email: '1020557056@qq.com',
} as const;

/** 网站备案信息（中国大陆合规要求）：自动渲染于全站页脚底部 */
export const LEGAL = {
  /** 工信部 ICP 备案号（链接 https://beian.miit.gov.cn/）。请与备案通知上的完整文本一致；若带站点序号后缀（如 豫ICP备2026042079号-1）则一并填入 */
  icp: '豫ICP备2026042079号',
  /** 公安联网备案号展示文本（如 '豫公网安备41132302000299号'）。留空则页脚不显示公安备案 */
  police: '豫公网安备41132302000299号',
  /** 公安联网备案编号：用于拼接查询链接 ?code=<编号>（官方代码片段中的数字部分） */
  policeCode: '41132302000299',
  /** 公安备案图标路径（官方警徽图标，位于 public/ 下；如从公安备案后台下载的图标不同，直接替换该文件即可） */
  policeBadge: '/beian.png',
} as const;

/** Artalk 评论系统配置 */
export const ARTALK = {
  /**
   * 本地开发留空（组件运行时按当前主机自动拼 http://<host>:23366）。
   * 生产：SakuraFrp 隧道 + 子域绑定（nyat.app 子域名，平台下发 SSL 证书，自动 HTTPS 须为「自动」）。
   * 必须是 HTTPS 地址，否则博客（HTTPS 页面）会以混合内容拦截评论脚本；隧道地址或端口变更后需同步修改此处并重新部署。
   */
  server: import.meta.env.DEV ? '' : 'https://dev-blog.u3924624.nyat.app:44295',
  /** 与服务器 ATK_SITE_DEFAULT 保持一致 */
  site: '家玉的博客',
} as const;

/** 分类元信息（与 styles/tokens.css 中的 --cat-* 对应） */
export const CATEGORIES = {
  tech: { en: 'TECH', zh: '科技', color: '#2e86ab' },
  philosophy: { en: 'PHILOSOPHY', zh: '哲学', color: '#7a63b8' },
  thoughts: { en: 'THOUGHTS', zh: '随想', color: '#c26aa5' },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

/** 返回已发布文章：置顶优先，其余按日期倒序 */
export async function getPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(
    (a, b) =>
      Number(b.data.pin) - Number(a.data.pin) || b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export type Post = CollectionEntry<'posts'>;

/** 标签 → 篇数，按数量降序（同数量按名称升序） */
export function countTags(posts: Post[]): [string, number][] {
  const m = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
}

/** 按年份倒序分组（归档时间线用） */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const m = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.date.getFullYear();
    const list = m.get(y);
    if (list) list.push(p);
    else m.set(y, [p]);
  }
  return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => ({ year, posts: list }));
}

/** 按日期倒序返回全部动态 */
export async function getMoments() {
  const moments = await getCollection('moments');
  return moments.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD HH:mm */
export function formatDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mm}`;
}

/** 粗略阅读时长（分钟）：中文按 400 字/分钟，英文按 200 词/分钟 */
export function readingTime(body?: string): number {
  if (!body) return 1;
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}
