/**
 * 文章档案终端：把三维档案阵列（./engine，移植自 RhineLabUI）接到博客文章上。
 *
 * - 阵列：每一列是一个分类，列内是该分类的文章；左右切列，上下切文章，点击 / 回车抽出档案。
 * - 详情：档案盒升起、对角线解密、玻璃变清，右侧文章信息同步「去涂黑」，可直接进入正文。
 * - 主题：跟随博客的 data-theme（冰川浅色 / 暗色），阵列按卡片逐张过渡。
 * - 性能：终端滚出视口或标签页隐藏时暂停；帧率不足时自动降画质；系统「减少动态效果」时动画直接到位。
 */
import { ArchiveScene } from "./engine/scene";
import {
  archiveColumns,
  columnFiles,
  fileLocation,
  records,
  setArchiveData,
  type ArchiveRecord,
} from "./engine/data";
import { wrap, type ArchiveNavigation } from "./engine/archive-loop";
import { qualityPresets, type RenderQuality } from "./engine/render-quality";
import { fullMotion, reducedMotion } from "./engine/motion-preferences";
import { InspectionOverlay } from "./engine/inspection-overlay";
import { prepareHaze, playHaze, cleanupHaze } from "./motion/haze-reveal";
import { playArchiveRead } from "./motion/read-hud";

type Mode = "archive" | "detail";
type Tab = "abstract" | "contents" | "related";
type QualityLevel = "ultra" | "high" | "eco" | "lite";

/** 无交互多久后停止 rAF（场景静止时按需渲染） */
const IDLE_WAKE_MS = 1600;

const QUALITY: Record<QualityLevel, { quality: RenderQuality; fast: boolean }> = {
  // ULTRA（手动选择）：跟随屏幕像素比（最高 2×）+ 透射 3/4 分辨率。最清晰，
  // 但揭幕运镜整阵列入画时 RTX 4060 笔记本也要 ~20ms/帧，60Hz 屏会掉帧；跑不动会自动降到 HQ。
  ultra: {
    quality: {
      ...qualityPresets.original,
      scale: 100,
      pixelRatio: 2,
      antialias: "smaa",
      shadows: 2048,
      aoSamples: 16,
      aoResolution: 0.5,
      depthOfField: 0,
      transmission: 0.75,
      anisotropy: 16,
    },
    fast: false,
  },
  // HQ（默认）：1.5× + SMAA，透射缓冲 1/2 分辨率（原来 1/4，玻璃后面的结构放大后发糊）。
  // 实测 RTX 4060 笔记本揭幕运镜 ~11ms/帧（p95 12.7ms），60Hz 屏也稳；静止时按需渲染。
  high: {
    quality: {
      ...qualityPresets.original,
      scale: 100,
      pixelRatio: 1.5,
      antialias: "smaa",
      shadows: 2048,
      aoSamples: 16,
      aoResolution: 0.5,
      depthOfField: 0,
      transmission: 0.5,
      anisotropy: 16,
    },
    fast: false,
  },
  // ECO：HQ 跑不到 30fps 时自动落到这里，所以不能太糊——1× 分辨率（原来 0.8×）+ SMAA，
  // 省在 AO / 阴影 / 透射分辨率上。
  eco: {
    quality: { ...qualityPresets.performance, scale: 100, antialias: "smaa", depthOfField: 0, anisotropy: 8 },
    fast: false,
  },
  lite: {
    quality: { scale: 70, pixelRatio: 1, antialias: "off", shadows: 0, aoSamples: 0, aoResolution: 0.5, depthOfField: 0, transmission: 0.25, anisotropy: 2 },
    fast: true,
  },
};
const QUALITY_KEY = "archive-quality";
const QUALITY_LABEL: Record<QualityLevel, string> = { ultra: "ULTRA", high: "HQ", eco: "ECO", lite: "LITE" };
/** 画质按钮循环顺序：HQ → ULTRA → ECO → LITE → HQ */
const QUALITY_NEXT: Record<QualityLevel, QualityLevel> = { high: "ultra", ultra: "eco", eco: "lite", lite: "high" };

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function readQuality(): QualityLevel | null {
  try {
    const value = localStorage.getItem(QUALITY_KEY);
    return value === "ultra" || value === "high" || value === "eco" || value === "lite" ? value : null;
  } catch {
    return null;
  }
}
function saveQuality(level: QualityLevel) {
  try {
    localStorage.setItem(QUALITY_KEY, level);
  } catch {
    /* 隐私模式等：不记忆即可 */
  }
}

/** 是否值得启动三维终端：窄屏 / 无 WebGL2 时直接用下方的列表视图 */
export function archiveTerminalSupported() {
  if (window.innerWidth < 760 || window.innerHeight < 480) return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export function mountArchiveTerminal(root: HTMLElement): () => void {
  const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const data = JSON.parse($("script[data-archive-data]").textContent || "{}") as {
    records: ArchiveRecord[];
    columns: string[];
  };
  setArchiveData(data.records, data.columns);
  if (!records.length) throw new Error("没有可展示的文章");

  const stage = $(".at-stage");
  const host = $(".at-scene");
  const panel = $(".at-detail-content");
  const hover = $(".at-hover");
  const status = $(".at-loading-text");
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;

  const layout = () => {
    stage.dataset.layout = root.clientWidth >= 1100 ? "desktop" : "compact";
  };
  layout();

  const scene = new ArchiveScene(host);
  const overlay = new InspectionOverlay($<SVGSVGElement>(".at-marks"), host);
  const isDark = () => document.documentElement.dataset.theme === "dark";
  let hazeActive = false;
  let hazeLines: HTMLElement[] = [];
  let readFinalRect: { x: number; y: number; width: number; height: number } | null = null;

  let mode: Mode = "archive";
  let selected = 0;
  let tab: Tab = "abstract";
  let ready = false;
  let reading = false;
  let disposed = false;
  let visible = true;
  let raf = 0;
  let activeUntil = 0;
  const savedQuality = readQuality();
  let level: QualityLevel = savedQuality ?? "high";
  const columnMemory = archiveColumns.map((_, lane) => columnFiles(lane)[0]);

  // ---------- 画质 ----------
  const applyQuality = () => {
    scene.setSuperPerformance(QUALITY[level].fast);
    scene.setQuality(QUALITY[level].quality);
    $(".at-quality").textContent = "画质 " + QUALITY_LABEL[level];
    root.dataset.quality = level;
    wake(1600);
  };
  // 自动降级：揭幕后采样约 2 秒，平均帧时长 > 45ms 就降一档（只在用户没手动选过时）
  // 默认、HQ、ULTRA 都允许自动降档；只有用户明确选了 ECO / LITE 才保持不动。
  let autoQuality = savedQuality === null || savedQuality === "high" || savedQuality === "ultra";
  let sample = { frames: 0, start: 0 };
  const watchFrameRate = (now: number) => {
    if (!autoQuality || level === "lite") return;
    if (!sample.start) sample = { frames: 0, start: now };
    sample.frames++;
    const elapsed = now - sample.start;
    if (elapsed < 1500) return;
    const average = elapsed / sample.frames;
    sample = { frames: 0, start: 0 };
    if (average <= 33) { autoQuality = false; return; }
    // 低于 30fps 逐级降档：ULTRA → HQ → ECO → LITE，每轮降一档。
    level = level === "ultra" ? "high" : level === "high" ? "eco" : "lite";
    applyQuality();
  };

  // ---------- 阵列选择 ----------
  const updateHud = () => {
    const r = records[selected];
    const { lane } = fileLocation(selected);
    const files = columnFiles(lane);
    $(".at-eyebrow-cat").textContent = r.categoryZh;
    $(".at-file-id").textContent = r.id;
    $(".at-file-name").textContent = r.title;
    $(".at-file-meta").textContent = `${r.date} // ${r.minutes} MIN`;
    $(".at-count-now").textContent = pad(files.indexOf(selected) + 1);
    $(".at-count-total").textContent = pad(files.length);
    $(".at-col-index").textContent = `${pad(lane + 1)} / ${pad(archiveColumns.length)}`;
    $(".at-col-name").textContent = `${r.categoryZh} ${r.categoryEn}`;
    $(".at-ticks").innerHTML = files
      .map((index) => {
        const record = records[index];
        const on = index === selected;
        return `<button type="button" data-select="${index}" class="${on ? "is-on" : ""}" aria-pressed="${on}" aria-label="选择 ${esc(record.title)}" title="${esc(record.id + " · " + record.title)}"></button>`;
      })
      .join("");
    root.style.setProperty("--at-cat", `var(--cat-${r.category}, var(--accent))`);
    // 只有 1 个分类 / 1 篇文章时箭头没有可去的地方：置灰并给出提示，而不是「点了没反应」。
    markSingle($(".at-colnav"), archiveColumns.length < 2, "目前只有 1 个分类有文章");
    markSingle($(".at-filenav"), files.length < 2, "这个分类目前只有 1 篇文章");
  };
  const markSingle = (nav: HTMLElement, single: boolean, tip: string) => {
    nav.toggleAttribute("data-single", single);
    nav.querySelectorAll<HTMLButtonElement>(":scope > button").forEach((button) => {
      button.setAttribute("aria-disabled", String(single));
      if (single) button.title = tip;
      else button.removeAttribute("title");
    });
  };
  /** 到头了：按钮朝点击方向轻轻弹一下（不禁用按钮，键盘/读屏仍可聚焦并读到提示）。 */
  const bump = (action: string) => {
    const button = root.querySelector<HTMLElement>(`[data-action="${action}"]`);
    if (!button || reduced) return;
    const axis = action.startsWith("col") ? "X" : "Y";
    const sign = action.endsWith("prev") ? -1 : 1;
    button.getAnimations().forEach((a) => a.cancel());
    button.animate(
      [
        { transform: "none" },
        { transform: `translate${axis}(${sign * 6}px)`, offset: 0.35 },
        { transform: `translate${axis}(${-sign * 2}px)`, offset: 0.7 },
        { transform: "none" },
      ],
      { duration: 380, easing: "cubic-bezier(.3,.7,.4,1)" },
    );
  };

  const select = (index: number, navigation?: ArchiveNavigation) => {
    selected = ((index % records.length) + records.length) % records.length;
    columnMemory[fileLocation(selected).lane] = selected;
    if (mode === "detail") setMode("archive");
    scene.select(selected, navigation);
    updateHud();
    wake(1800);
  };
  const stepFile = (direction: number) => {
    const files = columnFiles(fileLocation(selected).lane);
    const at = files.indexOf(selected);
    select(files[(at + direction + files.length) % files.length], { axis: "row", direction });
  };
  const stepColumn = (direction: number) => {
    const lane = wrap(fileLocation(selected).lane + direction, archiveColumns.length);
    select(columnMemory[lane], { axis: "lane", direction });
  };
  // 按钮 / 键盘入口：没有别的分类或文章时只给「到头」反馈。
  // 拖动阵列走 scene.onNavigate → stepColumn/stepFile，不经过这里，循环阵列照常滚动。
  const navColumn = (direction: number) => {
    if (archiveColumns.length < 2) return bump(direction < 0 ? "col-prev" : "col-next");
    stepColumn(direction);
  };
  const navFile = (direction: number) => {
    if (columnFiles(fileLocation(selected).lane).length < 2) return bump(direction < 0 ? "prev" : "next");
    stepFile(direction);
  };

  // ---------- 详情 ----------
  const tabMarkup = (r: ArchiveRecord, which: Tab) => {
    if (which === "abstract")
      return `<p class="at-label">ABSTRACT // 摘要</p><p class="at-abstract" data-redact>${esc(r.abstract)}</p>`;
    if (which === "contents") {
      if (!r.headings.length) return `<p class="at-label">CONTENTS // 目录</p><p class="at-empty">这篇文章没有小标题。</p>`;
      let n = 0;
      return `<p class="at-label">CONTENTS // 目录</p><ol class="at-toc">${r.headings
        .map((h) => {
          const num = h.depth === 2 ? pad(++n) : "·";
          return `<li class="${h.depth === 3 ? "is-sub" : ""}" data-redact><span>${num}</span><a href="${esc(r.url)}#${esc(h.slug)}">${esc(h.text)}</a></li>`;
        })
        .join("")}</ol>`;
    }
    if (!r.related.length) return `<p class="at-label">RELATED // 相关</p><p class="at-empty">还没有标签相同的文章。</p>`;
    return `<p class="at-label">RELATED // 相关</p><ol class="at-related">${r.related
      .map((i) => {
        const o = records[i];
        return `<li data-redact><a href="${esc(o.url)}"><b>${esc(o.id)}</b>${esc(o.title)}</a><button type="button" data-open="${i}">在阵列中查看 ↗</button></li>`;
      })
      .join("")}</ol>`;
  };

  const renderDetail = () => {
    const r = records[selected];
    tab = "abstract";
    // 预取文章页，缩短 READ FULL TEXT 最后整页跳转的等待。
    if (!document.querySelector(`link[data-at-prefetch="${r.url}"]`)) {
      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.href = r.url;
      prefetch.dataset.atPrefetch = r.url;
      document.head.append(prefetch);
    }
    // 镜头还在运镜中，此刻的投影不准；等揭示结束（镜头停稳）再算。
    readFinalRect = null;
    const meta = [
      ["CATEGORY / 分类", `${esc(r.categoryZh)} ${esc(r.categoryEn)}`],
      ["PUBLISHED / 发布", esc(r.date)],
      ["LENGTH / 篇幅", `${r.words.toLocaleString("en-US")} 字 · ${r.minutes} MIN`],
      ["UPDATED / 更新", r.updated ? esc(r.updated) : "—"],
    ];
    panel.innerHTML = `
      <div class="at-kicker"><span>FILE ${esc(r.id)}</span><span>${r.pin ? "PINNED // 置顶" : "ARTICLE ARCHIVE"}</span></div>
      <h2 data-redact>${esc(r.title)}</h2>
      <div class="at-tags" data-redact>${r.tags.map((t) => `<span>#${esc(t)}</span>`).join("") || "<span>#未分类</span>"}</div>
      <div class="at-rule"></div>
      <dl class="at-meta">${meta.map(([dt, dd]) => `<div><dt>${dt}</dt><dd data-redact>${dd}</dd></div>`).join("")}</dl>
      <div class="at-tabs" role="tablist">
        <button type="button" role="tab" data-tab="abstract" aria-selected="true">01 <span>摘要</span></button>
        <button type="button" role="tab" data-tab="contents" aria-selected="false">02 <span>目录</span></button>
        <button type="button" role="tab" data-tab="related" aria-selected="false">03 <span>相关</span></button>
        <i class="at-tab-bar" aria-hidden="true"></i>
      </div>
      <div class="at-tab-panel" role="tabpanel">${tabMarkup(r, "abstract")}</div>
      <div class="at-actions">
        <a class="at-solid" href="${esc(r.url)}">
          <i class="at-solid__bar" aria-hidden="true"></i><i class="at-solid__sheen" aria-hidden="true"></i>
          <i class="at-solid__c c0" aria-hidden="true"></i><i class="at-solid__c c1" aria-hidden="true"></i><i class="at-solid__c c2" aria-hidden="true"></i><i class="at-solid__c c3" aria-hidden="true"></i>
          <span class="at-solid__en">READ FULL TEXT</span>
          <span class="at-solid__go"><span class="at-solid__zh">阅读全文</span><span class="at-solid__arrow" aria-hidden="true">→</span></span>
        </a>
        <button type="button" class="at-ghost" data-action="copy">COPY LINK <span>⧉</span></button>
      </div>
      <div class="at-footnote"><span>BLOG_YU // ARTICLE ARCHIVE</span><span>${pad(r.no, 3)} / ${pad(records.length, 3)}</span></div>`;
    $(".at-object-no").textContent = "NO." + pad(r.no, 3);
    $(".at-object-cat").textContent = `${r.categoryEn} // ${r.categoryZh}`;
    // 信息栏出现即挂上朦胧遮蔽（停留到 HAZE.startDelay 再逐行揭示），不等 3D 运镜。
    panel.style.opacity = "1";
    panel.style.translate = "0 0";
    panel.inert = false;
    stage.style.setProperty("--detail-shade", "1");
    if (hazeActive) {
      cleanupHaze(hazeLines);
      hazeActive = false;
    }
    const lines = Array.from(panel.querySelectorAll<HTMLElement>("[data-redact]"));
    hazeLines = lines;
    prepareHaze(lines);
    hazeActive = true;
    // 注意：揭示期间 3D 运镜仍在进行，绝不能暂停渲染，否则镜头会冻在半路。
    void playHaze(lines).then(() => {
      if (disposed) return;
      hazeActive = false;
      hazeLines = [];
      // 镜头此时已停稳：按最终位姿预算 READ FULL TEXT 的档案盒矩形，点击时不必再算。
      readFinalRect = scene.readCaseRectFinal() ?? readFinalRect;
      wake(800);
    });
    requestAnimationFrame(moveTabBar);
    wake(2600);
  };

  const moveTabBar = () => {
    const button = panel.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    const bar = panel.querySelector<HTMLElement>(".at-tab-bar");
    if (button && bar) bar.style.transform = `translateX(${button.offsetLeft}px) scaleX(${button.offsetWidth})`;
  };

  const setTab = (next: Tab) => {
    if (next === tab) return;
    tab = next;
    panel.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
    const box = panel.querySelector<HTMLElement>(".at-tab-panel")!;
    box.innerHTML = tabMarkup(records[selected], tab);
    box.scrollTop = 0;
    if (!reduced) box.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    moveTabBar();
    wake(900);
  };

  const setMode = (next: Mode) => {
    if (next === mode) return;
    mode = next;
    stage.dataset.mode = next;
    scene.setMode(next);
    hover.hidden = true;
    $(".at-archive-ui").inert = next !== "archive";
    $(".at-detail-ui").inert = next !== "detail";
    if (next === "detail") renderDetail();
    else {
      // 离开详情：取消未完成的朦胧揭示，恢复 canvas 与相机交互。
      if (hazeActive) {
        cleanupHaze(hazeLines);
        hazeActive = false;
        hazeLines = [];
        wake(600);
      }
      $<HTMLButtonElement>(".at-access").focus({ preventScroll: true });
    }
    wake(next === "detail" ? 2600 : 1500);
  };
  const openFile = () => {
    if (ready) setMode("detail");
  };

  // ---------- 场景回调 ----------
  scene.onSelect = (index, cell) => {
    if (mode === "archive") select(index, cell ? { cell } : undefined);
  };
  scene.onNavigate = (axis, direction) => {
    if (mode !== "archive") return;
    if (axis === "lane") stepColumn(direction);
    else stepFile(direction);
  };
  scene.onHover = (index) => {
    wake(900);
    if (index === null || mode !== "archive") {
      hover.hidden = true;
      return;
    }
    const r = records[index];
    hover.textContent = `${r.id} / ${r.title}`;
    hover.hidden = false;
  };

  // ---------- READ FULL TEXT：HUD 锁定 · 描边解密 ----------
  const startHudRead = (link: HTMLAnchorElement) => {
    if (reading || !ready) return;
    reading = true;
    const target = link.href;
    // 揭示没播完就点击：先拆掉逐行 backdrop-filter 遮罩，否则它们要在退场的每一帧
    // 对下面逐帧重绘的 WebGL 画面重新做模糊，是点击瞬间长帧的主要来源。
    if (hazeActive) {
      cleanupHaze(hazeLines);
      hazeActive = false;
      hazeLines = [];
    }
    // 右栏信息逐行退场（自下而上 30ms 错开），左侧标签/档案堆由 CSS + 场景压暗处理。
    stage.classList.add("is-reading");
    [...panel.children].forEach((el, i, all) =>
      (el as HTMLElement).style.setProperty("--row", String(all.length - 1 - i)),
    );
    const stageRect = stage.getBoundingClientRect();
    // 优先用揭示结束时（镜头已停稳）预算好的矩形，点击瞬间不再做包围盒计算。
    const rect = readFinalRect ?? scene.readCaseRectFinal();
    const viewRect = rect
      ? {
          x: rect.x + stageRect.left,
          y: rect.y + stageRect.top,
          width: rect.width,
          height: rect.height,
        }
      : {
          x: stageRect.left + stageRect.width / 2 - 160,
          y: stageRect.top + stageRect.height / 2 - 110,
          width: 320,
          height: 220,
        };
    void playArchiveRead(target, viewRect, (ms) => {
      scene.beginReadFocus(ms / 1000);
      // 档案盒到位后停止逐帧渲染，HUD 期间只走合成层。
      window.setTimeout(() => {
        if (!reading) return;
        scene.renderSuspended = true;
      }, ms + 40);
    });
  };

  // ---------- 输入 ----------
  const onClick = (event: MouseEvent) => {
    const target = (event.target as Element).closest<HTMLElement>("button, a");
    if (!target || !root.contains(target)) return;
    wake(1800);
    if (target.matches("a.at-solid") && !reading) {
      event.preventDefault();
      startHudRead(target as HTMLAnchorElement);
      return;
    }
    if (target.dataset.select) return select(Number(target.dataset.select));
    if (target.dataset.tab) return setTab(target.dataset.tab as Tab);
    if (target.dataset.open) {
      const index = Number(target.dataset.open);
      setMode("archive");
      select(index);
      return;
    }
    switch (target.dataset.action) {
      case "prev": return navFile(-1);
      case "next": return navFile(1);
      case "col-prev": return navColumn(-1);
      case "col-next": return navColumn(1);
      case "open": return openFile();
      case "back": return setMode("archive");
      case "quality": {
        level = QUALITY_NEXT[level];
        autoQuality = false;
        saveQuality(level);
        return applyQuality();
      }
      case "list": {
        const href = root.dataset.listHref;
        if (href) {
          location.href = href;
          return;
        }
        return document.getElementById("post-list")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
      case "copy": {
        const url = new URL(records[selected].url, location.href).href;
        void navigator.clipboard?.writeText(url).then(
          () => {
            target.firstChild!.textContent = "COPIED ";
            setTimeout(() => target.isConnected && (target.firstChild!.textContent = "COPY LINK "), 1600);
          },
          () => {},
        );
        return;
      }
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (!ready || event.altKey || event.ctrlKey || event.metaKey) return;
    wake(1200);
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const key = event.key;
    if (key === "Escape" && mode === "detail") {
      event.preventDefault();
      setMode("archive");
      return;
    }
    if (mode === "detail") {
      if ((key === "ArrowLeft" || key === "ArrowRight") && (event.target as HTMLElement).dataset.tab) {
        event.preventDefault();
        const order: Tab[] = ["abstract", "contents", "related"];
        setTab(order[(order.indexOf(tab) + (key === "ArrowRight" ? 1 : 2)) % 3]);
        panel.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus();
      }
      return;
    }
    const moves: Record<string, () => void> = {
      ArrowLeft: () => navColumn(-1),
      ArrowRight: () => navColumn(1),
      ArrowUp: () => navFile(-1),
      ArrowDown: () => navFile(1),
    };
    if (moves[key]) {
      event.preventDefault();
      moves[key]();
    } else if (key === "Enter" && (event.target === root || (event.target as HTMLElement).closest(".at-archive-ui"))) {
      if ((event.target as HTMLElement).closest("button[data-action], button[data-select]") && event.target !== $(".at-access")) return;
      event.preventDefault();
      openFile();
    }
  };
  // 点到画布时让终端获得焦点，方向键随即可用（页面本身的滚动不受影响）
  const onPointerDown = (event: PointerEvent) => {
    wake(1200);
    if (event.target instanceof HTMLCanvasElement) root.focus({ preventScroll: true });
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  root.addEventListener("pointerdown", onPointerDown);
  const onPointerMove = (event: PointerEvent) => {
    // READ FULL TEXT 按钮的柔光跟随指针：只写两个 CSS 变量，由 ::after 的径向渐变读取。
    const solid = (event.target as Element | null)?.closest?.<HTMLElement>(".at-solid");
    if (solid) {
      const box = solid.getBoundingClientRect();
      solid.style.setProperty("--mx", `${event.clientX - box.left}px`);
      solid.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
    wake(600);
  };
  const onWheel = () => wake(1200);
  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("wheel", onWheel, { passive: true });

  // ---------- 主题 / 动效 / 尺寸 / 可见性 ----------
  const themeObserver = new MutationObserver(() => {
    scene.setTheme(isDark(), reduced);
    wake(1800);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const onMotion = () => {
    reduced = reducedQuery.matches;
    scene.setMotion(reduced ? reducedMotion() : fullMotion());
    root.classList.toggle("is-reduced", reduced);
    wake(1600);
  };
  reducedQuery.addEventListener("change", onMotion);
  const resizeObserver = new ResizeObserver(() => {
    layout();
    scene.resize();
    moveTabBar();
    wake(1200);
  });
  resizeObserver.observe(root);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sample = { frames: 0, start: 0 };
    if (visible) wake(1600);
  });
  visibility.observe(root);
  const onVisibility = () => {
    sample = { frames: 0, start: 0 };
    if (!document.hidden) wake(1600);
  };
  document.addEventListener("visibilitychange", onVisibility);

  // ---------- 帧循环（按需渲染：交互/动画时跑，静止后停） ----------
  let lastShade = -1;
  function scheduleFrame() {
    if (disposed || raf || !ready || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }
  function wake(keep = IDLE_WAKE_MS) {
    activeUntil = Math.max(activeUntil, performance.now() + keep);
    // 从休眠中唤醒时重置帧率采样，避免把睡眠间隔算进去导致误降档。
    if (!raf) sample = { frames: 0, start: 0 };
    scheduleFrame();
  }
  function frame(ms: number) {
    raf = 0;
    if (disposed) return;
    if (!visible || document.hidden || !ready) return;
    const time = ms / 1000;
    scene.update(time);
    watchFrameRate(ms);
    const shade = scene.detailVisibility;
    if (Math.abs(shade - lastShade) > 0.002) {
      lastShade = shade;
      stage.style.setProperty("--detail-shade", String(shade));
    }
    overlay.render(scene.decryptionFrame, (x, y) => scene.projectCard(x, y), !reduced);
    if (performance.now() < activeUntil) scheduleFrame();
  }

  // 仅开发环境：把场景挂到 window，方便在浏览器控制台里调参与测量（生产构建会被剔除）。
  if (import.meta.env.DEV) {
    (window as Window & { __archive?: unknown }).__archive = { scene, wake, stage };
  }

  // ---------- 启动 ----------
  onMotion();
  applyQuality();
  scene.setTheme(isDark(), true);
  updateHud();
  const modelUrl = root.dataset.model!;
  scene
    .load(modelUrl, (ratio) => {
      status.textContent = `LOADING ARCHIVE // ${Math.round(ratio * 100)}%`;
    })
    .then(async () => {
      if (disposed) return;
      scene.select(selected);
      scene.snapToSelection();
      scene.setMode("archive");
      applyQuality();
      // 载入画面还在时预编译着色器 + 离屏渲染一帧，揭幕头几帧不再卡。
      status.textContent = "LOADING ARCHIVE // 100%";
      await scene.warmup();
      if (disposed) return;
      ready = true;
      stage.dataset.mode = "archive";
      root.dataset.state = "ready";
      void document.fonts?.ready.then(() => !disposed && scene.redrawLabel());
      // 初始运镜/揭幕需要连续渲染；静下来后自动停 rAF。
      wake(3500);
    })
    .catch((error) => {
      console.error("[archive] 三维档案载入失败", error);
      if (!disposed) root.dataset.state = "error";
    });

  let cleaned = false;
  const cleanup = (deferDispose = false) => {
    if (cleaned) return;
    cleaned = true;
    disposed = true;
    if (import.meta.env.DEV) delete (window as Window & { __archive?: unknown }).__archive;
    cancelAnimationFrame(raf);
    raf = 0;
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("wheel", onWheel);
    reducedQuery.removeEventListener("change", onMotion);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    themeObserver.disconnect();
    resizeObserver.disconnect();
    visibility.disconnect();
    // 转场过程中不释放 WebGL：文章页空闲时再 dispose，避免关键帧卡顿。
    if (deferDispose) {
      const idle = () => scene.dispose();
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
          .requestIdleCallback(idle, { timeout: 2500 });
      } else {
        window.setTimeout(idle, 400);
      }
    } else {
      scene.dispose();
    }
  };
  // 整页跳转（READ FULL TEXT 的兜底）也会触发 pagehide：确保 WebGL 资源释放。
  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) cleanup();
  };
  window.addEventListener("pagehide", onPageHide);
  return cleanup;
}
