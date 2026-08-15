# 鹰角网络 / 明日方舟 官网前端设计研究报告

> 数据来源：直接抓取并解析 `www.hypergryph.com`、`ak.hypergryph.com`、`endfield.hypergryph.com` 的 HTML/CSS（含 hycdn.cn CDN 上引用的压缩 CSS，已 gunzip 解码），并辅以 web_search 第三方评价。

## 一、设计定位与风格差异

- **鹰角官网（hypergryph.com）**：极简「品牌门户」。白底/黑底 + 高饱和霓虹黄绿 `#f3ff00` 作为唯一强调色；几何字标用 **Bender / Geometos** 两款几何无衬线展示 LOGO，中文用**思源黑体**。动效克制（`0.3–0.5s` 缓动），信息少、留白多，传递「逻辑艺术」的冷峻科技感。
- **明日方舟官网（ak.hypergryph.com）**：暗色「工业机能风」（Next.js SSR）。近黑背景（`#1d1f20 / #121212`）+ 标志性青色 `#18d1ff` 高亮，辅以橄榄绿/荧光绿。英文标题用窄体无衬线 **Novecentosanswide / Oswald**，中文用思源黑体。动效更丰富（`transform/opacity 0.3–2s`），卡片锐角（radius≈0/2px），大量半透明黑遮罩与青色发光描边，视觉像游戏内 UI。
- **终末地（Endfield）**：暗底 `#191919` + 霓虹黄 `#fffa00`、品红 `#ff1aac`、荧光绿 `#00ffa2` 多点缀，更「赛博工业」。

横向结论：三站共享「**暗底 + 单一高饱和强调色 + 几何窄体字**」的家族基因，差异仅在强调色与动效密度。

## 二、可复用 Design Tokens

**颜色**

| Token | 值 | 用途 |
|---|---|---|
| 方舟主强调 cyan | `#18d1ff`（±`#19d1ff`/`#06bbff`） | 链接/按钮/发光描边 |
| cyan 光晕 | `rgba(24,209,255,.5 / .25)` | 悬停发光 |
| 鹰角品牌黄绿 | `#f3ff00` | 品牌强调 |
| 暗底 900/800/700 | `#121212 / #1d1f20 / #242424 / #272727` | 背景层级 |
| 次级文字灰 | `#585858 / #8d8d8d / #ababab` | 弱化文本 |
| 主文字 | `#d2d2d2 / #fff` | 正文/标题 |
| 辅助强调 | `#8fc31f`（橄榄绿）、`#c8eb21`（荧光绿）、`#3387fb`（蓝） | 分类标签 |
| 遮罩 | `rgba(0,0,0,.4–.9)` | 图片压暗、弹层 |

**字体栈**

```css
--font-display: 'Novecentosanswide','Bender','Oswald',sans-serif; /* 英文标题/数字 */
--font-body: 'SourceHanSans','PingFang SC','Microsoft YaHei',sans-serif; /* 中文正文 */
```

可替代方案：Novecentosanswide → `Archivo Narrow` / `Barlow Condensed`；Bender → `Oswald` / `Rajdhani`。

**布局 / 间距 / 边框 / 圆角 / 动效**

- 布局：全屏分屏（100vh section）、横向 swiper 卡片、内容区 `1200–1280px` 居中、12 列栅格、卡片间距 `24–32px`。
- 边框：细描边 `1px solid rgba(255,255,255,.12)`。
- 圆角：锐利为主 `0 / 2px / 8px`；切角按钮可用 `clip-path: polygon(...)` 做斜切。
- 动效：`transition: color .3s, background-color .3s`（最常用）、`transform .3s/.6s`（位移）、`opacity .3s/.6s/1s`（淡入）、`ease / ease-in-out`；入场用 `opacity 0→1 + translateY(12px→0)`。

## 三、迁移到个人博客的 6 条做法

1. **暗底单强调色**：页面 `#121212` 背景、正文 `#d2d2d2`，全站只用一种高饱和强调色（如 `#18d1ff`）做链接与 hover 光晕，保持克制。
2. **首页 = 全屏 Hero + 分屏区块**：首屏 100vh 放博客名 + 一句 slogan（大号窄体英文标题 + 中文副标），下方按「文章 / 关于 / 项目」分屏滚动，每屏独立背景图并叠加 `rgba(0,0,0,.5)` 遮罩。
3. **导航用固定顶栏 + 描边高亮**：透明顶栏，滚动后 `background: rgba(0,0,0,.88)` 毛玻璃；当前菜单项用强调色下划线/发光，配 `transition: color .3s`。
4. **文章卡片 = 锐角 + 窄体标题**：`border-radius: 2px`，卡片底/左用 `1px solid rgba(255,255,255,.12)` 分隔；标题用窄体加粗无衬线，日期用灰色小字 `#8d8d8d`；hover 时 `transform: translateY(-4px)` + 标题变强调色（`.3s`）。
5. **标签/分类用「暗底 + 荧光字」**：标签用 `#8fc31f`/`#3387fb` 小圆角块，或用强调色描边块。
6. **动效统一到 0.3s**：所有 hover 用 `transition: color .3s, background-color .3s, transform .3s`；避免花哨动画。

## 附：第三方评价要点

- 腾讯游戏学堂《明日方舟 UI/UX 分析》称其「好看背后的先进性」在于扁平几何 + 高对比单色的信息层级（[链接](https://gameinstitute.qq.com/index.php/knowledge/100122)）。
- 社区普遍把鹰角视觉识别为「暗色工业风 + 霓虹强调色 + 窄体字」，LOGO 的几何感与网站一脉相承（[LOGO 设计杂谈](https://www.xiaohongshu.com/discovery/item/6887206a0000000013013500)）。
