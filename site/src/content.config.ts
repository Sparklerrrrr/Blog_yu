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
    /** 草稿：true 时不发布 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
