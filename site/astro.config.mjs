// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: { port: 4322 }, // 避开 4321（另有网站占用）
});
