# 博客施工蓝图（明天开工用）

> 与 `style-notes.md` 配套。研究阶段已完成；本文件是把研究结论翻译成「明天可以直接动手」的实现规格。
> 开工前置：用户确认 3 个决策（见文末「开放问题」），确认后按「实施顺序」逐步执行即可。

---

## 一、技术栈

**默认推荐：Astro**
- 理由：静态输出、Markdown/MDX 原生支持、内容集合（Content Collections）天然适合博客分类+主题色系统、组件用 JSX/TS 心智负担低、构建快。
- 结构：`pnpm create astro@latest` → minimal 模板。

**备选：Next.js（App Router）**——用户若要求更多交互（评论、搜索、动态皮肤切换）再选。

---

## 二、设计系统落地（CSS 变量 v1）

```css
/* ===== 皮肤 A：方舟经典暗色工业（默认） ===== */
:root {
  --bg:         #121212;
  --bg-panel:   #1d1f20;
  --bg-raised:  #242424;
  --text:       #d2d2d2;
  --text-dim:   #ababab;
  --text-faint: #585858;
  --accent:     #18d1ff;
  --accent-glow: rgba(24,209,255,.5);
  --line:       rgba(255,255,255,.12);
  --line-strong:rgba(255,255,255,.5);
  --radius:     2px;
}

/* ===== 皮肤 B：鹰角品牌酸色（品牌区/首页 Hero 可局部启用） ===== */
[data-skin="hg"] {
  --bg: #282828; --bg-panel: #2e2e2e; --bg-raised: #313131;
  --text: #e8e6e3; --accent: #f3ff00; --accent-glow: rgba(243,255,0,.5);
}

/* ===== 皮肤 C：危机合约橙红（「技术/警示」类专题页） ===== */
[data-skin="cc"] {
  --bg: #15171a; --bg-panel: #1e2226; --bg-raised: #262b30;
  --text: #e8eaed; --text-dim: #9aa0a6; --text-faint: #5c6268;
  --accent: #f59a1f; --accent-2: #2f7f9e;
}
```

**分类主题色系统**（仿官方新闻卡 `themeColor`，每分类一个强调色）：

| 分类 | 主题色 | 英文微标签 |
|---|---|---|
| 技术 | `#18d1ff` | `TECH` |
| 设计 | `#fb7eff` | `DESIGN` |
| 生活 | `#fdf900` | `LIFE` |
| 思考 | `#f7dcf0` | `THOUGHTS` |
| 游戏/项目 | `#ff1e00` | `PROJECT` |

实现：文章 frontmatter 带 `category` 字段 → `data-category="tech"` 挂到卡片 → CSS 变量覆盖 `--accent`。

**字体加载**（Google Fonts，Bender/Novecentosanswide 的商业替代）：

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
--font-display: "Rajdhani", "Oswald", sans-serif;   /* 英文标题/数字，可用 Oswald 换口味 */
--font-body:    "Noto Sans SC", "PingFang SC", sans-serif;
--font-serif:   "Noto Serif SC", serif;              /* 装饰水印/引言 */
--font-mono:    "JetBrains Mono", monospace;
```

**全局字距/边框/动效工具类**（官方 CSS 实证的参数）：

```css
.display-title { font-family: var(--font-display); font-weight: 700; letter-spacing: -.05em; } /* 大标题 */
.micro-label   { font-family: var(--font-display); font-size: .75rem; text-transform: uppercase; letter-spacing: .12em; } /* 英文微标签 */
.accent-bar    { border-left: .5rem solid var(--accent); }              /* 左侧强调条 */
.hairline      { border-bottom: 1px solid var(--line-strong); }         /* 细分割线 */
.card          { border: 1px solid var(--line); border-radius: var(--radius); background: var(--bg-panel);
                 transition: transform .3s, border-color .3s; }
.card:hover    { transform: translateY(-4px); border-color: var(--accent-glow); }
.entrance      { animation: rise .6s ease both; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.glass         { background: rgba(0,0,0,.88); backdrop-filter: blur(8px); }
```

---

## 三、组件清单与规格

| 组件 | 规格要点 |
|---|---|
| **TopNav 固定顶栏** | 透明 → 滚动后 `.glass` 毛玻璃；左 = 站名（display 字体大写），右 = 菜单；当前项强调色下划线；hover 0.3s |
| **Hero 首屏** | 100vh；站名 = 大号窄体英文（40–80px，字距 -0.05em）+ 中文 slogan 灰字；角落放 `001` / `LOG` 类半透明水印字；向下滚动提示（细线+微标签 `SCROLL`） |
| **SectionHeader 区块头** | 微标签（如 `FEATURED`）+ display 标题 + 细分割线 |
| **ArticleCard 文章卡** | 左侧 4–8px 分类主题色条（`border-left`）或卡片切角（`clip-path` 12px 斜切）；微标签 + 标题（display 700）+ 日期灰字；hover 上浮 4px + 标题变主题色 |
| **Tag 标签** | 1px 描边小方块/胶囊，radius 2px；hover 描边变强调色；文字 `--text-dim` |
| **Blockquote 引用块** | 左 8px 强调条（`.accent-bar`）+ `--text-dim` 文字，去掉斜体默认 |
| **CodeBlock 代码块** | `--bg-raised` 面板 + `--line` 描边 + JetBrains Mono；行号用 `--text-faint` |
| **Watermark 装饰水印** | 大号（120px+）display/衬线字，透明度 ~6%，压在区块角落，`pointer-events: none` |
| **CarouselRow 精选横排** | 横向 scroll-snap 卡片行，两侧渐隐遮罩；配左右箭头微标签 `PREV / NEXT` |
| **Footer 页脚** | 细线顶边；微标签导航 + 版权灰字；可放装饰坐标字（如 `31.2304°N 121.4737°E`） |

---

## 四、页面规格

1. **首页**：TopNav → Hero（100vh）→ 精选 CarouselRow → 最新文章 grid（2–3 列）→ 分类入口（每分类一块，用其主题色）→ 关于简版 → Footer
2. **文章列表页 `/posts`**：页面头（微标签 `ARCHIVE` + display 标题）→ 分类过滤 tab（斜切/胶囊，选中态主题色描边）→ 卡片 grid → Footer
3. **文章页**：TopNav（毛玻璃）→ 文章头（分类微标签+主题色 + display 标题 + 日期/阅读时长灰字 + 装饰编号）→ 正文窄栏 720px（h2 用 display 字体、引用/代码按上表规格）→ 上一篇/下一篇 → Footer
4. **关于页**：分屏区块（每屏 100vh 或大留白），大 display 标题 + 短段落 + 水印字

---

## 五、实施顺序（明天按此 checklist 走）

1. 脚手架 + 全局 CSS 变量 + 字体加载 + 三皮肤定义
2. 通用件：TopNav、Footer、微标签、SectionHeader、水印字
3. 首页（Hero + 精选 + 列表 + 分类）
4. 内容集合 + 分类主题色系统（frontmatter → `data-category`）
5. 文章列表页 + 过滤
6. 文章页排版（标题/引用/代码）
7. 关于页 + 皮肤 B/C 落地示例
8. 响应式（移动端：卡片单列、Hero 字号缩放、顶栏折叠）+ 动效细节打磨

---

## 六、开放问题（开工前需用户拍板）

1. **技术栈**：Astro（默认推荐）还是 Next.js？
2. **默认配色**：皮肤 A 方舟青（推荐）/ B 鹰角酸黄 / C 危机合约橙红？
3. **博客名与内容**：站名（英文名会做成 Hero 大标题）、写哪几类内容（决定分类与主题色）？
