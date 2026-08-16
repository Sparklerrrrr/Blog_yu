import rss from '@astrojs/rss';
import { getPosts, SITE } from '../lib/site';

export async function GET(context: { site?: URL }) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.zh} · ${SITE.en}`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: `<language>zh-cn</language>`,
  });
}
