# BLOG_YU · 家玉的小站（site/）

鹰角 / 明日方舟风格的 Astro 个人博客，v2.1.0。整体冰川蓝浅色主题 + 暗色冰川皮肤切换。

设计参考：ak.hypergryph.com（导航板块与横向过渡）、blog.myqfeng.top（导航布局、搜索面板、音乐播放器 UI）、070219.xyz（选中高亮）、deepseek.com/harness（版块透明度与 hover 发光）。

设计文档在上级目录：`../style-notes.md`、`../BUILD-PLAN.md`；设计系统已落地为 `src/styles/` 下按域拆分的四个文件（tokens / layout / components / pages）。

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
- 资源 → /resources/
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
- **加歌**：mp3 放 `public/music/`（封面放 `public/music/covers/`），在 **`src/data/music.ts`** 的 `PLAYLIST` 数组加一行即可（唯一数据源，播放器与列表自动更新）：

```ts
{ title: '歌名', artist: '歌手', src: '/music/文件名.mp3', cover: '/music/covers/封面.jpg' },
```

构建时会自动校验文件是否存在，缺了会在构建日志里警告。

## 资源下载

- 资源板块 `/resources/`：数据集中在 **`src/data/resources.ts`**（唯一数据源），页面展示统计磁贴、搜索 / 分类筛选 / 排序（筛选状态同步到 URL，可刷新、可分享）、NEW 角标与 SHA256 校验值一键复制
- **加资源**：文件放 `public/resources/`，然后在 `src/data/resources.ts` 的 `RAW_RESOURCES` 数组加一行：

```ts
{
  name: '资源名',
  desc: '一句话描述',
  category: 'code',      // code 源码 / docs 文档
  tags: ['标签'],
  url: '/resources/文件名.zip',
  date: '2026-08-16',
  version: '1.0.0',      // 可选，显示在卡片上
},
```

- **大小与 SHA256 校验值在构建时自动从磁盘计算**，无需手动维护 `size`；文件缺失或声明大小与实际不符会在构建日志里警告
- 发布「博客源码」资源时重新打包（zip 命令不可用时可用 Python，效果相同）：

```sh
cd site
zip -r ../public/resources/blog-yu-source-v<版本>.zip .   -x 'node_modules/*' 'dist/*' '.git/*' 'public/music/*' 'public/gallery/*'      'public/wallpapers/*' 'public/sponsor/*' 'public/resources/*' 'public/icons/*' '.astro/*'
# 或 Python：
python3 - << 'PY'
import zipfile, os
EXCLUDE = {'node_modules','dist','.astro','.git','public/music','public/gallery',
           'public/wallpapers','public/sponsor','public/resources','public/icons'}
with zipfile.ZipFile('public/resources/blog-yu-source-v2.1.0.zip','w',zipfile.ZIP_DEFLATED,9) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        for f in files:
            z.write(os.path.join(root,f), os.path.join(root,f).lstrip('./'))
PY
```

  然后更新 `resources.ts` 里的版本与链接

## 定制

- **换配色**：`src/styles/tokens.css` 顶部 `:root`（当前 `--accent: #3f9bc2`，选中底色 `--accent-soft: #7ec8e3`，链接 `--accent-deep: #1f7397`）；`data-skin="ark" / "hg" / "cc"` 切暗色备用皮肤
- **暗色冰川**：导航「亮暗」按钮切换（`data-theme="dark"`，记忆在 localStorage）
- **选中高亮**：`::selection`（`--selection-bg` / `--selection-fg`）
- **微交互**：小卡片「令牌」反光 + 小幅 3D 倾斜（小版块随指针倾斜，表面反光带随倾斜滑动，大背景板不参与，仅精细指针）、`/` 或 `Ctrl/Cmd+K` 打开搜索、搜索面板 `↑↓/Enter` 键盘选择、统计数字滚动、Hero 视差淡出、明暗切换淡入淡出、Toast 复制反馈、Logo 点击转圈彩蛋、灯箱淡出（实现集中在 `src/scripts/app.ts` 与 `src/styles/` 各段，全部尊重 `prefers-reduced-motion`）
- **站点信息**：`src/lib/site.ts` 的 `SITE`（站名/署名/描述/坐标）
- **备案信息**：`src/lib/site.ts` 的 `LEGAL`（`icp` 备案号 / `police` 公安号 / `policeBadge` 图标路径），页脚自动渲染为盾牌徽标 + 工信部链接（公安备案号留空则不显示）
- **增删分类**：`src/lib/site.ts` 的 `CATEGORIES` + `src/content.config.ts` 的 `category` 枚举 + CSS 里补 `--cat-*` 色值
- **导航结构**：`src/components/TopNav.astro`
- **全局交互**（下拉/搜索/主题/播放器/滚动显现）：`src/scripts/app.ts`（由 BaseLayout 引入）

## 目录结构

```text
site/
├── public/                  # favicon、music/（mp3 与封面）、resources/（下载资源）
└── src/
    ├── pages/               # 首页 / 归档 / 分类 / 标签 / 友链 / 留言 / 动态 / 相册 / 追番 / 资源 / 打赏 / 关于 / 搜索 / 文章页 / 404
    ├── layouts/BaseLayout.astro   # 布局骨架 + OpenGraph
    ├── scripts/app.ts       # 全站客户端交互（导航/搜索/主题/播放器/动效）
    ├── components/          # TopNav / Hero / ArticleCard / SectionHead / Tag / EmptyState / AvatarParticles / Comments / ProgressRing / Footer
    ├── content.config.ts    # 文章集合 schema
    ├── content/posts/       # 文章
    ├── data/                # friends.ts / music.ts / resources.ts（各板块唯一数据源）
    ├── lib/site.ts          # 站点信息与分类元数据
    └── styles/              # tokens / layout / components / pages（按域拆分）
```
