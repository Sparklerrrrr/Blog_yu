import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    /** 文章标题 */
    title: z.string(),
    /** 摘要（列表页显示） */
    description: z.string().optional(),
    /** 发布日期（YYYY-MM-DD 即可） */
    date: z.coerce.date(),
    /** 分类：tech 技术 / life 生活 / thoughts 思考 */
    category: z.enum(['tech', 'life', 'thoughts']),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 最后更新日期（可选；比 date 晚时详情页显示「最后更新」） */
    updated: z.coerce.date().optional(),
    /** 置顶：true 时排在列表最前并显示置顶徽标 */
    pin: z.boolean().default(false),
    /** 草稿：true 时不发布 */
    draft: z.boolean().default(false),
  }),
});

const moments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/moments' }),
  schema: z.object({
    /** 时间（YYYY-MM-DD HH:mm 均可） */
    date: z.coerce.date(),
    /** 类型：text 文字 / image 图片 / link 链接 */
    type: z.enum(['text', 'image', 'link']).default('text'),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 图片（相对 public/ 的路径，如 /wallpapers/asuka-line.jpg） */
    images: z.array(z.string()).default([]),
    /** 链接地址（type: link 时显示跳转按钮） */
    link: z.string().optional(),
    /** 链接按钮文字 */
    linkText: z.string().optional(),
  }),
});

export const collections = { posts, moments };
