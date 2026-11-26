// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  server: { port: 4322 }, // 避开 4321（另有网站占用）
  /** 站点根地址：RSS / sitemap / canonical 用；上线后按实际域名修改 */
  site: 'https://www.sparklerrr.cn',
  integrations: [sitemap()],
  // 关闭 Astro 自带的悬停预取：它依赖 HTTP 缓存，HTML 不可缓存时导航还会再请求一遍；
  // 而且不识别 download 链接，会把资源页的大 zip 也预取下来。
  // 预取改由 src/scripts/app.ts 实现（悬停/聚焦/按下即取，导航直接复用响应）。
  prefetch: false,
});
