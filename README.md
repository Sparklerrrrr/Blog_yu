# BLOG_YU · 家玉的小站

> 灵感来自鹰角网络与《明日方舟》平面设计的个人博客，整体冰川蓝浅色主题，基于 Astro 构建。
> 设计参考：[明日方舟官网](https://ak.hypergryph.com/)（导航与板块过渡）、[清风博客](https://blog.myqfeng.top/)（导航布局与音乐播放器）、[070219.xyz](https://070219.xyz/)（选中高亮）、[DeepSeek Harness](https://www.deepseek.com/harness/)（版块透明度与发光）。

**当前版本：v2.1.0**

## ✨ 特性

- **冰川蓝主题**：有色调的中性色、选中文字高亮、暗色冰川皮肤一键切换（记忆在 localStorage）
- **顶部导航栏**（仿清风博客）：主页 / 文章▾（归档·分类·标签）/ 社交▾（友链·留言·联系）/ 我的▾（动态·相册·追番）/ 资源 / 关于▾（打赏·关于我）/ 链接▾（GitHub·Gitee·Bilibili）+ 搜索 + 亮暗切换
- **悬浮搜索面板**：右上角放大镜 → 磨砂玻璃面板，实时过滤标题/摘要/标签
- **悬浮音乐播放器**（仿清风博客 UI）：旋转封面、细进度条、循环模式、音量记忆、播放列表；内存级 Audio，**切换页面音乐不断**
- **动效**：字母入场、板块横向滑入、滚动显现、卡片 3D 倾斜、页面切换过渡、hover 发光
- **内容系统**：Markdown 写作，分类（科技/哲学/随想）+ 标签；独立标签归档页、按年份分组的归档时间线、置顶与最后更新时间
- **文章列表页**：分类 / 标签 / 关键词组合过滤（URL 参数可分享），卡片显示分类色条与阅读时长
- **文章详情页**：左侧常驻目录引导（编号徽标 + 滑动指示器 + 进度 + 自动跟随，窄屏折叠）、上一篇/下一篇、相关文章推荐、标题锚点链接、阅读时长
- **合规页脚**：底部居中展示工信部 ICP 备案徽标（蓝色盾牌图标 + 备案号，链接 beian.miit.gov.cn，仿 blog.cuteleaf.cn）；公安备案号审核通过后填入自动并排显示（配置在 `site/src/lib/site.ts` 的 `LEGAL`）
- **RSS 与 SEO**：RSS 订阅源（/rss.xml）、sitemap 自动生成、OpenGraph / canonical 元信息
- **动态**：说说式时间线（文字/图片/链接），Markdown 写作，配图点击放大
- **相册**：壁纸合集（16 张，灯箱查看，支持左右切换/键盘/滑动）
- **追番**：构建时自动同步 B 站追番列表（在看/想看/看过，本地缓存兜底 + 最近同步时间）
- **友链**：清风式友链卡（favicon + 搜索/标签筛选 + 分组展示 + 随机排序 + 一键检测在线状态 + 申请位卡片），申请区仿清风博客：左侧本站信息一键复制、右侧申请指引（含申请模板）、下方注意事项，数据集中在 `site/src/data/friends.ts` 维护
- **留言板**：站点公告、Artalk 数据面板（全站/本页留言数、站点访问、最新留言时间线，运行时拉取失败自动降级）与评论框一体化
- **联系页**：GitHub / Gitee / Bilibili 账号卡 + 邮箱一键复制 + RSS 订阅入口
- **打赏**：支付宝 + 微信收款码打赏页，支持支付宝深链一键跳转付款、微信收款链接智能跳转（微信内直达付款 / 浏览器复制链接跳转）
- **数据面板**：首页站点统计（文章/分类/标签/字数/运行时长）+ 站点信息 + 日历与年度热力图；资源页统计磁贴（总数/分类/总大小）
- **资源下载**：源码/文档资源归档，构建时自动从磁盘计算大小与 SHA256 校验值，支持搜索、分类筛选、排序（筛选状态同步 URL 可分享），一键复制校验值与下载链接
- **首页壁纸**：明日香线条壁纸（已换成冰川蓝线条）
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
category: tech        # tech 科技 / philosophy 哲学 / thoughts 随想
tags: [Astro, 设计]    # 自动生成标签页 /tags/标签名/
updated: 2026-08-16   # 最后更新（可选，晚于 date 时详情页显示 UPDATED）
pin: false            # true 时置顶到列表最前并显示徽标
draft: false          # true 时不发布
---

正文内容……（## / ### 标题自动带左侧强调条、进入文章目录；悬停标题显示 # 锚点链接）
```

文章页自动附带：左侧常驻目录引导（跟随阅读位置高亮）、上一篇/下一篇导航、按共同标签推荐的相关文章。

## 📡 订阅

- **RSS**：`/rss.xml`（生成地址由 `astro.config.mjs` 的 `site` 与 `src/lib/site.ts` 的 `SITE.url` 决定，上线后按实际域名修改）
- **Sitemap**：构建时自动生成 `sitemap-index.xml`，含全部页面与标签归档页

## 💬 写动态

在 `site/src/content/moments/` 下新建 Markdown 文件（文件名即排序用，日期在 frontmatter 里）：

```md
---
date: 2026-08-16 20:30
type: text        # text 文字 / image 图片 / link 链接
tags: [博客]
images:           # type: image 时填（相对 public/ 的路径）
  - /wallpapers/asuka-line.jpg
link: https://ak.hypergryph.com/   # type: link 时填
linkText: 访问官网
---

动态正文……（就是 Markdown，支持链接等）
```

## 🎵 加歌

把 mp3 放进 `site/public/music/`（封面放 `site/public/music/covers/`），然后在 `site/src/data/music.ts` 的 `PLAYLIST` 数组加一行：

```ts
{ title: '歌名', artist: '歌手', src: '/music/文件名.mp3', cover: '/music/covers/封面.jpg' },
```

## 📦 资源下载

资源文件放 `site/public/resources/`，在 `site/src/data/resources.ts` 加一行即可（详见 [site/README.md](site/README.md)）：

```ts
{ name: '资源名', desc: '描述', category: 'code', tags: ['标签'], url: '/resources/文件名.zip', date: '2026-08-16', version: '1.0.0' },
```

大小与 SHA256 校验值在构建时自动从磁盘计算；页面支持搜索 / 分类筛选 / 排序（URL 可分享），并可一键复制校验值与下载链接。

## 🎨 换肤与定制

- **配色**：`site/src/styles/tokens.css` 顶部 `:root`（`--accent` 等），或 `data-skin="ark" / "hg" / "cc"` 切暗色备用皮肤
- **站点信息**：`site/src/lib/site.ts` 的 `SITE`（站名/署名/坐标）与 `CATEGORIES`（分类）
- **导航结构**：`site/src/components/TopNav.astro`

## 🏗️ 目录结构

```
blog_yu/
├── site/                        # Astro 项目
│   ├── src/
│   │   ├── components/          # TopNav / Hero / ArticleCard / 播放器 / 占位页…
│   │   ├── content.config.ts    # 文章 + 动态集合 schema
│   │   ├── content/posts/       # 文章
│   │   ├── content/moments/     # 动态
│   │   ├── data/friends.ts      # 友链数据（分组/标签/图标）
│   │   ├── data/music.ts        # 音乐曲库（唯一数据源）
│   │   ├── data/resources.ts    # 下载资源（大小/SHA256 构建时自动派生）
│   │   ├── layouts/             # BaseLayout（页面骨架 + OpenGraph）
│   │   ├── scripts/             # app.ts（全站客户端交互：导航/搜索/主题/播放器/动效）
│   │   ├── lib/site.ts          # 站点与分类元数据（含 Artalk 配置/邮箱）
│   │   ├── pages/               # 首页/文章/归档/分类/标签/搜索/友链/留言/联系/动态/相册/追番/打赏/关于…
│   │   │   ├── posts/[slug].astro  # 文章详情（目录/上下篇/相关文章）
│   │   │   ├── tags/[tag].astro    # 标签归档
│   │   │   └── rss.xml.ts          # RSS 订阅源
│   │   └── styles/              # tokens / layout / components / pages（按域拆分的四段样式）
│   ├── public/                  # favicon、音乐、封面等静态资源
│   └── astro.config.mjs         # 端口 4322 / site / sitemap
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
