# BLOG_YU · 家玉的小站（site/）

鹰角 / 明日方舟风格的 Astro 个人博客，v1.0。整体冰川蓝浅色主题 + 暗色冰川皮肤切换。

设计参考：ak.hypergryph.com（导航板块与横向过渡）、blog.myqfeng.top（导航布局、搜索面板、音乐播放器 UI）、070219.xyz（选中高亮）、deepseek.com/harness（版块透明度与 hover 发光）。

设计文档在上级目录：`../style-notes.md`、`../BUILD-PLAN.md`、`../design-system.css`（草案，已落地为 `src/styles/design-system.css`）。

## 运行

```sh
pnpm install         # 安装依赖
pnpm dev             # 开发服务器 http://localhost:4322（端口在 astro.config.mjs 固定）
pnpm dev --background # 后台模式（pnpm astro dev stop / status / logs 管理）
pnpm build           # 构建到 dist/
pnpm preview         # 本地预览构建产物
```

## 导航结构（仿 blog.myqfeng.top）

- 主页 → /
- **文章** ▾ 归档 /archive/ · 分类 /categories/ · 标签 /tags/
- **社交** ▾ 友链 /friends/ · 留言 /guestbook/
- **我的** ▾ 动态 /dynamic/ · 相册 /gallery/ · 追番 /anime/
- **关于** ▾ 打赏 /sponsor/ · 关于我 /about/
- **链接** ▾ GitHub · Gitee · Bilibili（新标签打开，带外链箭头图标）
- 右侧工具：搜索（悬浮面板）/ 亮暗切换 / 汉堡（移动端）

## 写文章

在 `src/content/posts/` 下新建 Markdown（文件名即 URL，如 `my-first-post.md` → `/posts/my-first-post/`）：

```md
---
title: 文章标题
description: 一句话摘要（可选，列表页显示）
date: 2026-08-15
category: tech        # tech 技术 / life 生活 / thoughts 思考
tags: [Astro, 设计]
draft: false          # true 时不发布
---

正文……（## 二级标题自动带左侧强调条，> 引用块同样）
```

- `category` 决定卡片左色条与文章页强调色：tech 冰川蓝 / life 琥珀黄 / thoughts 雾粉
- 草稿不生成路由、不出现在任何列表

## 音乐播放器

- 悬浮弹窗（导航栏音符按钮），UI 仿 blog.myqfeng.top：旋转封面 / 时间音量行 / 细进度条（hover 圆点）/ 控件行（循环·上首·播放·下首·列表）
- **内存级 Audio**：站内切换页面音乐不断（除非点暂停或整页刷新）
- 音量记忆在 localStorage；循环模式：列表 → 单曲 → 随机
- **加歌**：mp3 放 `public/music/`（封面放 `public/music/covers/`），在 `src/components/TopNav.astro` 的 `tracks` 数组加一行：

```ts
{ title: '歌名', artist: '歌手', src: '/music/文件名.mp3', cover: '/music/covers/封面.jpg' },
```

## 定制

- **换配色**：`src/styles/design-system.css` 顶部 `:root`（当前 `--accent: #3f9bc2`，选中底色 `--accent-soft: #7ec8e3`，链接 `--accent-deep: #1f7397`）；`data-skin="ark" / "hg" / "cc"` 切暗色备用皮肤
- **暗色冰川**：导航「亮暗」按钮切换（`data-theme="dark"`，记忆在 localStorage）
- **选中高亮**：`::selection`（`--selection-bg` / `--selection-fg`）
- **站点信息**：`src/lib/site.ts` 的 `SITE`（站名/署名/描述/坐标）
- **增删分类**：`src/lib/site.ts` 的 `CATEGORIES` + `src/content.config.ts` 的 `category` 枚举 + CSS 里补 `--cat-*` 色值
- **导航结构**：`src/components/TopNav.astro`
- **全局交互**（下拉/搜索/主题/播放器/滚动显现）：`src/layouts/BaseLayout.astro` 的集中脚本

## 目录结构

```text
site/
├── public/                  # favicon、music/（mp3 与封面）
└── src/
    ├── pages/               # 首页 / 归档 / 分类 / 标签 / 友链 / 留言 / 动态 / 相册 / 追番 / 打赏 / 关于 / 搜索 / 文章页 / 404
    ├── layouts/BaseLayout.astro   # 布局 + 全局交互脚本
    ├── components/          # TopNav / Hero / ArticleCard / SectionHead / Tag / EmptyState / Placeholder / ProgressRing / Footer
    ├── content.config.ts    # 文章集合 schema
    ├── content/posts/       # 文章
    ├── lib/site.ts          # 站点信息与分类元数据
    └── styles/design-system.css
```
