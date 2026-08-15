# BLOG_YU · 家玉的小站

> 灵感来自鹰角网络与《明日方舟》平面设计的个人博客，整体冰川蓝浅色主题，基于 Astro 构建。
> 设计参考：[明日方舟官网](https://ak.hypergryph.com/)（导航与板块过渡）、[清风博客](https://blog.myqfeng.top/)（导航布局与音乐播放器）、[070219.xyz](https://070219.xyz/)（选中高亮）、[DeepSeek Harness](https://www.deepseek.com/harness/)（版块透明度与发光）。

**当前版本：v1.0**

## ✨ 特性

- **冰川蓝主题**：有色调的中性色、选中文字高亮、暗色冰川皮肤一键切换（记忆在 localStorage）
- **顶部导航栏**（仿清风博客）：主页 / 文章▾（归档·分类·标签）/ 社交▾（友链·留言）/ 我的▾（动态·相册·追番）/ 关于▾（打赏·关于我）/ 链接▾（GitHub·Gitee·Bilibili）+ 搜索 + 亮暗切换
- **悬浮搜索面板**：右上角放大镜 → 磨砂玻璃面板，实时过滤标题/摘要/标签
- **悬浮音乐播放器**（仿清风博客 UI）：旋转封面、细进度条、循环模式、音量记忆、播放列表；内存级 Audio，**切换页面音乐不断**
- **动效**：字母入场、板块横向滑入、滚动显现、卡片 3D 倾斜、页面切换过渡、hover 发光
- **内容系统**：Markdown 写作，分类（技术/生活/思考）+ 标签，归档/分类/标签页自动生成
- **设计文档**：风格研究笔记与施工蓝图（见下方「相关文档」）

## 🚀 快速开始

```bash
cd site
pnpm install
pnpm dev        # http://localhost:4322（端口已固定，避开 4321）
pnpm build      # 构建到 site/dist/
```

## 📝 写文章

在 `site/src/content/posts/` 下新建 Markdown 文件（文件名即 URL 路径）：

```md
---
title: 文章标题
description: 一句话摘要（可选）
date: 2026-08-15
category: tech        # tech 技术 / life 生活 / thoughts 思考
tags: [Astro, 设计]
draft: false          # true 时不发布
---

正文内容……（## 二级标题自动带左侧强调条）
```

## 🎵 加歌

把 mp3 放进 `site/public/music/`，然后在 `site/src/components/TopNav.astro` 的 `tracks` 数组加一行：

```ts
{ title: '歌名', artist: '歌手', src: '/music/文件名.mp3', cover: '/music/covers/封面.jpg' },
```

## 🎨 换肤与定制

- **配色**：`site/src/styles/design-system.css` 顶部 `:root`（`--accent` 等），或 `data-skin="ark" / "hg" / "cc"` 切暗色备用皮肤
- **站点信息**：`site/src/lib/site.ts` 的 `SITE`（站名/署名/坐标）与 `CATEGORIES`（分类）
- **导航结构**：`site/src/components/TopNav.astro`

## 🏗️ 目录结构

```
blog_yu/
├── site/                        # Astro 项目
│   ├── src/
│   │   ├── components/          # TopNav / Hero / ArticleCard / 播放器 / 占位页…
│   │   ├── content.config.ts    # 文章集合 schema
│   │   ├── content/posts/       # 文章
│   │   ├── layouts/             # BaseLayout（含全局交互脚本）
│   │   ├── lib/site.ts          # 站点与分类元数据
│   │   ├── pages/               # 首页/归档/分类/标签/友链/留言/动态/相册/追番/打赏/关于/搜索…
│   │   └── styles/design-system.css
│   ├── public/                  # favicon、音乐、封面等静态资源
│   └── astro.config.mjs         # 端口 4322
├── style-notes.md               # 风格设计笔记
├── BUILD-PLAN.md                # 施工蓝图
├── arknights-ui-style-report.md # 方舟 UI 研究报告
├── hypergryph-design-tokens-report.md # 官网设计令牌报告
└── LICENSE
```

## 📚 相关文档

- [style-notes.md](style-notes.md) - 风格设计笔记（design tokens 总表）
- [BUILD-PLAN.md](BUILD-PLAN.md) - 施工蓝图
- [arknights-ui-style-report.md](arknights-ui-style-report.md) - 方舟 UI/UX 研究报告
- [hypergryph-design-tokens-report.md](hypergryph-design-tokens-report.md) - 官网前端设计报告

## 📄 许可证

代码 MIT；文章以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 许可发布。
