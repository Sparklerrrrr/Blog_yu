# 鹰角 / 明日方舟风格 · 博客风格笔记

> 调研方法：① 抓取鹰角官网、方舟官网 HTML/CSS/JS 并做 token 级分析（含 CDN 压缩包解码）；
> ② 截图 + 像素级配色直方图实证；③ 两篇子代理深度报告（见同目录 `hypergryph-design-tokens-report.md` 与 `arknights-ui-style-report.md`）。
> 本文件是合成结论，明天做博客时以它为准。

---

## 一、一句话概括

**「暗底 + 单一高饱和强调色 + 几何窄体字 + 锐利直角 + 0.3s 克制动效 + 大留白」**。
方舟的「高级感」来自克制：黑白灰打底，饱和色只做点缀（全站占比 <5%），靠字重对比、细描边、毛玻璃和留白建立秩序感，而不是靠花哨装饰。

---

## 二、三个参照物的风格定位（实证）

| 参照物 | 基调 | 强调色（CSS 实证） | 展示字体（CSS 实证） | 特点 |
|---|---|---|---|---|
| **鹰角官网** hypergryph.com | 深炭灰暗色 `#282828~#313131` | 酸荧光黄绿 `#f3ff00`（全页只出现 2 处：首屏标题 + 中部按钮） | Bender、Geometos | 极简品牌门户，中文思源黑体，`blur(8px)` 毛玻璃面板 |
| **方舟官网** ak.hypergryph.com | 深导航 `#202325` + 浅色内容区（随当期活动换肤） | 青 `#18d1ff`（链接/描边/发光）+ 每张新闻卡独立 `themeColor`（粉 `#f7dcf0`/黄 `#fdf900`/洋红 `#fb7eff`/青/红 `#ff1e00`） | Novecentosanswide、Oswald、Bender | 单页分屏滚动（index/information/operator/world/media），swiper 卡片轮播，宽字距英文小标签（"PREVIEW"“EXPANSION”） |
| **方舟游戏内 UI / 活动界面** | 冷黑灰 `#15171a~#2f343a`，文字 `#e8eaed` | 橙红 `#f59a1f`/`#e8612c`（警戒感）、科技蓝 `#2f7f9e`、青绿 `#8fdfe0` | 黑体 Heavy + 负字距；衬线（Trajan/宋体）做古典装饰；等宽做数据氛围 | 同一套组件骨架，**活动只换「皮肤变量」**：危机合约=黑底橙红警戒条纹；集成战略=复古点阵羊皮纸；sidestory=按地区换字体纹样 |

**关键结论**：鹰角全家桶共享基因——「暗底 + 单强调色 + 几何窄体字」；方舟官网当前的浅色只是当期夏活（"信使的工作"，浅底+蓝 `#246099`）的皮肤，经典形态是深色+青。

---

## 三、可复用 Design Tokens（合并三份来源，明天直接抄）

### 颜色（三套备选皮肤）

**A. 方舟经典暗色工业（推荐作为博客默认）**
```css
--bg:        #121212;   /* 页面底 */
--bg-panel:  #1d1f20;   /* 卡片/面板 */
--bg-raised: #242424;   /* 更高层 */
--text:      #d2d2d2;   /* 正文 */
--text-dim:  #ababab;   /* 次要 */
--text-faint:#585858;   /* 弱化 */
--accent:    #18d1ff;   /* 唯一高饱和强调：链接/选中/描边 */
--accent-glow: rgba(24,209,255,.5);   /* hover 光晕 */
--line:      rgba(255,255,255,.12);   /* 1px 细描边 */
```

**B. 鹰角官网品牌酸色（首页 Hero / 品牌区可用）**
```css
--bg: #282828;  --bg-raised: #313131;  --accent: #f3ff00;  --text: #e8e6e3;
```

**C. 危机合约橙红（「技术/警示」类目皮肤）**
```css
--bg: #15171a;  --bg-panel: #1e2226;  --bg-raised: #262b30;
--text: #e8eaed;  --text-dim: #9aa0a6;  --text-faint: #5c6268;
--accent: #f59a1f;  --accent-2: #2f7f9e;
```

### 字体

```css
--font-display: "Novecentosanswide","Bender","Oswald",sans-serif; /* 英文标题/数字 */
--font-body:    "Source Han Sans SC","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
--font-serif:   "Source Han Serif SC","Noto Serif SC",serif;      /* 古典装饰水印 */
--font-mono:    "JetBrains Mono",ui-monospace,monospace;           /* 数据/坐标氛围 */
```
- 免费替代（Google Fonts 可直接用）：Novecentosanswide/Bender → **Rajdhani / Archivo Narrow / Oswald / Barlow Condensed**；中文用 **Noto Sans SC**。
- **字距规则**（官方 CSS 实证）：大标题 `letter-spacing: -.05em`（紧）；装饰性英文小标签全大写 + `letter-spacing: .12em`（宽）；正文 0。字重对比要狠：标题 700/800，正文 400。

### 图形 / 边框 / 圆角

- **直角为主**：`border-radius: 0 / 2px / 8px`（官方 CSS 实证），禁用大圆角。
- **细描边**：`1px solid rgba(255,255,255,.12)`；分割线 `border-bottom: 1px solid hsla(0,0%,100%,.5)`。
- **左侧强调条**（官方签名手法）：`border-left: .5rem solid var(--accent)`。
- **斜切**：`skewX(45deg)` 或卡片切角 `clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)`。
- **警戒斜条纹 / 噪点 / vignette**：活动感装饰，用在「专题」封面。卡片 vignette：`box-shadow: inset 0 0 60px rgba(0,0,0,.35)`。
- **投影克制**：`0 1px 0 rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6)`，不要厚重弥散阴影。

### 布局

- 全屏 Hero（100vh）+ 分屏滚动区块；内容区 `1200–1280px` 居中；卡片间距 `24–32px`。
- 固定顶栏：透明 → 滚动后 `rgba(0,0,0,.88) + backdrop-filter: blur(8px)` 毛玻璃。
- 新闻/文章用横向卡片轮播（swiper），每张卡带自己的 `themeColor`。

### 动效（全部统一）

```css
/* hover 默认：0.3s，只动颜色/背景/位移 */
transition: color .3s, background-color .3s, transform .3s;
/* 卡片 hover：上浮 + 标题变强调色 */
transform: translateY(-4px);
/* 入场：淡入 + 上移 12px */
opacity: 0 → 1;  translateY(12px → 0);
/* 长淡入 1s 用于全屏切换 */
```
禁止花哨弹跳/无限循环动画。

---

## 四、「活动界面」手法如何迁移到博客（核心思路）

方舟做活动的思路 = **同一套组件骨架，只换「皮肤变量」**（色、字、纹样）。博客直接套用：

1. **全站默认** = 经典暗色工业（皮肤 A，青色）。
2. **每个分类/专题一个主题色**：如「技术」青 `#18d1ff`、「设计」洋红 `#fb7eff`、「生活」黄 `#fdf900`、「思考」粉 `#f7dcf0`（官方新闻卡的 themeColor 系统就是这样）。
3. **专题页皮肤**：特别专题（如年度总结）可整页换肤——换背景色 + 强调色 + 装饰纹样（斜条纹/点阵），骨架不变。
4. **英文微标签**：每篇文章卡片配一个全大写宽字距小标签（如 `ESSAY`、`NOTES`、`SERIES`），这是「舟味」最便宜的获得方式。
5. **装饰水印字**：大号半透明几何字/衬线字压在区块角落（如 `001`、`LOG`），营造工业档案感。

---

## 五、博客落地方案草案（明天实施）

### 页面结构
- **首页**：全屏 Hero（博客名 = 大号窄体英文 + 中文 slogan + 酸色/青色点缀）→ 精选文章横向卡片轮播 → 分类导航 → 关于。
- **文章列表页**：锐角卡片网格，卡片 = 主题色左条 + 英文微标签 + 窄体标题 + 灰色日期；hover 上浮 4px + 标题变色。
- **文章页**：毛玻璃固定顶栏；正文窄栏（~720px）；标题下「日期 + 标签 + 装饰坐标/编号字」；引用块用左侧 8px 强调条；代码块用暗面板 + 等宽字体。
- **关于页**：分屏区块 + 大留白。

### 技术栈（明天先问用户再定）
- 推荐 **Astro**（内容为主、能输出静态、内置 Markdown/MDX、做主题皮肤方便）；备选 Next.js（用户若想要更多交互）。

### 明天的第一步
先建 CSS 变量文件（皮肤 A/B/C 各一套）→ 再做组件（顶栏/卡片/标签/引用块）→ 再搭页面。

---

## 六、参考资源

- 腾讯游戏学院《明日方舟 UI/UX 分析》：https://gameinstitute.qq.com/index.php/knowledge/100122
- 机核《从 6 个角度拆解：明日方舟的视觉细节》：https://www.gcores.com/articles/112810
- NGA《从概念到视觉：明日方舟主题活动的风格化解决方案》：https://bbs.nga.cn/read.php?tid=42448443
- 「舟味」UI/UX 解析 PDF（janniewang）：https://janniewang.net/wp-content/uploads/2023/09/UIUX-analysis-for-Arknights.pdf
- 鹰角官网：https://www.hypergryph.com ｜ 方舟官网：https://ak.hypergryph.com
- 字体：Rajdhani / Archivo Narrow / Oswald / Noto Sans SC / Noto Serif SC（Google Fonts）
