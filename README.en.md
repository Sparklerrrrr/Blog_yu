# BLOG_YU · Jia Yu's Station

A personal technical blog built on the visual style of *Arknights*, implementing multi-theme switching using Astro + CSS Variable Systems.

## ✨ Features

- **Multi-Theme System**: Three style themes: `ark` (Arknights), `hg` (Integration Knight), `cc` (Rhine Lab)
- **Category System**: Five content categories: tech, life, thoughts, design, project
- **Design Language**: Complete design tokens (colors, fonts, layout, animations)
- **Component Library**: Modular components such as ArticleCard, Tag, SectionHead, Hero, etc.
- **Responsive Layout**: Adaptive design based on CSS variables

## 🚀 Quick Start

```bash
cd site
pnpm install
pnpm dev
```

Visit `http://localhost:4321` to preview the site.

## 📝 Write Articles

Create Markdown files in the `site/src/content/posts/` directory:

```md
---
title: Article Title
date: 2024-01-01
tags: [tag1, tag2]
draft: false          # If true, do not publish
---

Article content...
```

## 🏗️ Directory Structure

```
blog_yu/
├── site/                    # Astro Project
│   ├── src/
│   │   ├── components/     # Components
│   │   ├── content/        # Post Content
│   │   ├── layouts/        # Layout Templates
│   │   ├── pages/          # Page Routes
│   │   └── styles/         # Style Files
│   ├── public/             # Static Assets
│   └── astro.config.mjs    # Configuration
├── design-system.css       # Design Tokens
├── style-notes.md          # Style Notes
└── LICENSE
```

## 🎨 Theme Switching

Switch themes via the `data-skin` attribute:

```html
<body data-skin="ark">    <!-- Arknights Style -->
<body data-skin="hg">     <!-- Integration Knight Style -->
<body data-skin="cc">     <!-- Rhine Lab Style -->
```

## 📚 Related Documents

- [BUILD-PLAN.md](BUILD-PLAN.md) - Build Plan
- [style-notes.md](style-notes.md) - Style Design Notes
- [arknights-ui-style-report.md](arknights-ui-style-report.md) - UI/UX Research Report
- [hypergryph-design-tokens-report.md](hypergryph-design-tokens-report.md) - Design Tokens Report

## 📄 License

MIT

---

*Built with ❤️ and ☕*