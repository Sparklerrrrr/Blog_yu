// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  server: { port: 4322 }, // 避开 4321（另有网站占用）
  /** 站点根地址：RSS / sitemap / canonical 用；上线后按实际域名修改 */
  site: 'https://blog.sparklerrr.cn',
  integrations: [sitemap()],
});
