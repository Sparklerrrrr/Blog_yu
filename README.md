

根据提供的代码地图和项目结构，我来为您生成一个完整的README.md文件。

---

# BLOG_YU · 家玉的小站

基于《明日方舟》视觉风格构建的个人技术博客，使用 Astro + CSS 变量系统实现多主题切换。

## ✨ 特性

- **多主题系统**：`ark`（明日方舟）、`hg`（整合骑士）、`cc`（莱茵生命）三套风格主题
- **分类体系**：tech、life、thoughts、design、project 五大内容分类
- **设计语言**：完整的 design tokens（颜色、字体、布局、动效）
- **组件库**：ArticleCard、Tag、SectionHead、Hero 等模块化组件
- **响应式布局**：基于 CSS 变量的自适应设计

## 🚀 快速开始

```bash
cd site
pnpm install
pnpm dev
```

访问 `http://localhost:4321` 预览站点。

## 📝 写文章

在 `site/src/content/posts/` 目录下创建 Markdown 文件：

```md
---
title: 文章标题
date: 2024-01-01
tags: [tag1, tag2]
draft: false          # true 时不发布
---

文章内容...
```

## 🏗️ 目录结构

```
blog_yu/
├── site/                    # Astro 项目
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── content/        # 文章内容
│   │   ├── layouts/        # 布局模板
│   │   ├── pages/          # 页面路由
│   │   └── styles/         # 样式文件
│   ├── public/             # 静态资源
│   └── astro.config.mjs    # 配置
├── design-system.css       # 设计令牌
├── style-notes.md          # 风格笔记
└── LICENSE
```

## 🎨 主题切换

通过 `data-skin` 属性切换主题：

```html
<body data-skin="ark">    <!-- 明日方舟风格 -->
<body data-skin="hg">     <!-- 整合骑士风格 -->
<body data-skin="cc">     <!-- 莱茵生命风格 -->
```

## 📚 相关文档

- [BUILD-PLAN.md](BUILD-PLAN.md) - 施工蓝图
- [style-notes.md](style-notes.md) - 风格设计笔记
- [arknights-ui-style-report.md](arknights-ui-style-report.md) - UI/UX 研究报告
- [hypergryph-design-tokens-report.md](hypergryph-design-tokens-report.md) - 设计令牌报告

## 📄 许可证

MIT

---

*Built with ❤️ and ☕*