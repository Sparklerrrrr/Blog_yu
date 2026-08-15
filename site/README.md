# BLOG_YU · 家玉的小站

鹰角网络 / 明日方舟风格的 Astro 个人博客。暗色底 + 冰川蓝点缀 + 锐利直角 + 0.3s 克制动效。

设计文档在项目上级目录：`../style-notes.md`（风格笔记）、`../BUILD-PLAN.md`（施工蓝图）、`../design-system.css`（起步草案，已落地为 `src/styles/design-system.css`）。

## 运行

```sh
pnpm install        # 安装依赖
pnpm dev            # 开发服务器 http://localhost:4322（端口已在 astro.config.mjs 固定）
pnpm dev --background  # 后台模式（astro dev stop / status / logs 管理）
pnpm build          # 构建到 dist/
pnpm preview        # 本地预览构建产物
```

## 写文章

在 `src/content/posts/` 下新建 Markdown 文件（文件名即 URL 路径，例如 `my-first-post.md` → `/posts/my-first-post/`）：

```md
---
title: 文章标题
description: 一句话摘要（可选，列表页显示）
date: 2026-08-15
category: tech        # tech 技术 / life 生活 / thoughts 思考
tags: [Astro, 设计]
draft: false          # true 时不发布
---

正文内容……
```

- `category` 决定卡片左侧色条与文章页强调色：tech 冰川蓝 `#7ec8e3` / life 黄 `#fdf900` / thoughts 粉 `#f7dcf0`
- 正文里的二级标题（`##`）会自动带左侧强调条；`>` 引用块同样
- 草稿（`draft: true`）不会出现在任何列表页，也不会生成路由

## 目录结构

```text
site/
├── public/                  # favicon 等静态资源
└── src/
    ├── pages/               # 首页 / 归档 / 文章页 / 关于 / 404
    ├── layouts/BaseLayout.astro
    ├── components/          # TopNav / Hero / ArticleCard / Footer …
    ├── content.config.ts    # 文章集合 schema
    ├── content/posts/       # 文章放这里
    ├── lib/site.ts          # 站点信息与分类元数据
    └── styles/design-system.css
```

## 定制

- **换配色**：改 `src/styles/design-system.css` 顶部 `:root` 里的 `--accent`（当前冰川蓝 `#7ec8e3`），或给页面根元素挂 `data-skin="ark" / "hg" / "cc"` 切换备用皮肤
- **站点信息**：改 `src/lib/site.ts` 的 `SITE`（站名/署名/描述/坐标）
- **增删分类**：改 `src/lib/site.ts` 的 `CATEGORIES` 与 `src/content.config.ts` 的 `category` 枚举，再在 CSS 里补对应 `--cat-*` 色值
