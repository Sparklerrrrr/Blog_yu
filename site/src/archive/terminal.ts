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
import { DocumentDecryption } from "./engine/document-decryption";

type Mode = "archive" | "detail";
type Tab = "abstract" | "contents" | "related";
type QualityLevel = "high" | "eco" | "lite";

const QUALITY: Record<QualityLevel, { quality: RenderQuality; fast: boolean }> = {
  high: { quality: { ...qualityPresets.original }, fast: false },
  eco: { quality: { ...qualityPresets.performance }, fast: false },
  lite: {
    quality: { scale: 70, pixelRatio: 1, antialias: "off", shadows: 0, aoSamples: 0, aoResolution: 0.5, depthOfField: 0, transmission: 0.25, anisotropy: 2 },
    fast: true,
  },
};
const QUALITY_KEY = "archive-quality";
const QUALITY_LABEL: Record<QualityLevel, string> = { high: "HQ", eco: "ECO", lite: "LITE" };

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function readQuality(): QualityLevel | null {
  try {
    const value = localStorage.getItem(QUALITY_KEY);
    return value === "high" || value === "eco" || value === "lite" ? value : null;
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
  const reveal = new DocumentDecryption();
  const isDark = () => document.documentElement.dataset.theme === "dark";

  let mode: Mode = "archive";
  let selected = 0;
  let tab: Tab = "abstract";
  let ready = false;
  let disposed = false;
  let visible = true;
  let raf = 0;
  let level: QualityLevel = readQuality() ?? "high";
  const columnMemory = archiveColumns.map((_, lane) => columnFiles(lane)[0]);

  // ---------- 画质 ----------
  const applyQuality = () => {
    scene.setSuperPerformance(QUALITY[level].fast);
    scene.setQuality(QUALITY[level].quality);
    $(".at-quality").textContent = "画质 " + QUALITY_LABEL[level];
    root.dataset.quality = level;
  };
  // 自动降级：揭幕后采样约 2 秒，平均帧时长 > 45ms 就降一档（只在用户没手动选过时）
  let autoQuality = readQuality() === null;
  let sample = { frames: 0, start: 0 };
  const watchFrameRate = (now: number) => {
    if (!autoQuality || level === "lite") return;
    if (!sample.start) sample = { frames: 0, start: now };
    sample.frames++;
    const elapsed = now - sample.start;
    if (elapsed < 2000) return;
    if (elapsed / sample.frames > 45) {
      level = level === "high" ? "eco" : "lite";
      applyQuality();
    } else autoQuality = false;
    sample = { frames: 0, start: 0 };
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
  };

  const select = (index: number, navigation?: ArchiveNavigation) => {
    selected = ((index % records.length) + records.length) % records.length;
    columnMemory[fileLocation(selected).lane] = selected;
    if (mode === "detail") setMode("archive");
    scene.select(selected, navigation);
    updateHud();
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
        <a class="at-solid" href="${esc(r.url)}">READ FULL TEXT <span>阅读全文 →</span></a>
        <button type="button" class="at-ghost" data-action="copy">COPY LINK <span>⧉</span></button>
      </div>
      <div class="at-footnote"><span>BLOG_YU // ARTICLE ARCHIVE</span><span>${pad(r.no, 3)} / ${pad(records.length, 3)}</span></div>`;
    $(".at-object-no").textContent = "NO." + pad(r.no, 3);
    $(".at-object-cat").textContent = `${r.categoryEn} // ${r.categoryZh}`;
    reveal.reset(panel, reduced || scene.decryptionFrame.phase === "clear");
    requestAnimationFrame(moveTabBar);
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
    else $<HTMLButtonElement>(".at-access").focus({ preventScroll: true });
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
    if (index === null || mode !== "archive") {
      hover.hidden = true;
      return;
    }
    const r = records[index];
    hover.textContent = `${r.id} / ${r.title}`;
    hover.hidden = false;
  };

  // ---------- 输入 ----------
  const onClick = (event: MouseEvent) => {
    const target = (event.target as Element).closest<HTMLElement>("button, a");
    if (!target || !root.contains(target)) return;
    if (target.dataset.select) return select(Number(target.dataset.select));
    if (target.dataset.tab) return setTab(target.dataset.tab as Tab);
    if (target.dataset.open) {
      const index = Number(target.dataset.open);
      setMode("archive");
      select(index);
      return;
    }
    switch (target.dataset.action) {
      case "prev": return stepFile(-1);
      case "next": return stepFile(1);
      case "col-prev": return stepColumn(-1);
      case "col-next": return stepColumn(1);
      case "open": return openFile();
      case "back": return setMode("archive");
      case "quality": {
        level = level === "high" ? "eco" : level === "eco" ? "lite" : "high";
        autoQuality = false;
        saveQuality(level);
        return applyQuality();
      }
      case "list":
        return document.getElementById("post-list")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
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
      ArrowLeft: () => stepColumn(-1),
      ArrowRight: () => stepColumn(1),
      ArrowUp: () => stepFile(-1),
      ArrowDown: () => stepFile(1),
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
    if (event.target instanceof HTMLCanvasElement) root.focus({ preventScroll: true });
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  root.addEventListener("pointerdown", onPointerDown);

  // ---------- 主题 / 动效 / 尺寸 / 可见性 ----------
  const themeObserver = new MutationObserver(() => scene.setTheme(isDark(), reduced));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const onMotion = () => {
    reduced = reducedQuery.matches;
    scene.setMotion(reduced ? reducedMotion() : fullMotion());
    root.classList.toggle("is-reduced", reduced);
  };
  reducedQuery.addEventListener("change", onMotion);
  const resizeObserver = new ResizeObserver(() => {
    layout();
    scene.resize();
    moveTabBar();
    reveal.refresh();
  });
  resizeObserver.observe(root);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sample = { frames: 0, start: 0 };
  });
  visibility.observe(root);

  // ---------- 帧循环 ----------
  const frame = (ms: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden || !ready) return;
    const time = ms / 1000;
    scene.update(time);
    watchFrameRate(ms);
    const shade = scene.detailVisibility;
    stage.style.setProperty("--detail-shade", String(shade));
    if (mode === "detail") {
      reveal.update(time, scene.decryptionFrame, reduced);
      panel.style.opacity = String(shade);
      panel.style.translate = `0 ${(1 - shade) * 18}px`;
      panel.inert = shade < 0.1;
    }
    overlay.render(scene.decryptionFrame, (x, y) => scene.projectCard(x, y), !reduced);
  };

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
    .then(() => {
      if (disposed) return;
      scene.select(selected);
      scene.snapToSelection();
      scene.setMode("archive");
      applyQuality();
      ready = true;
      stage.dataset.mode = "archive";
      root.dataset.state = "ready";
      void document.fonts?.ready.then(() => !disposed && scene.redrawLabel());
      raf = requestAnimationFrame(frame);
    })
    .catch((error) => {
      console.error("[archive] 三维档案载入失败", error);
      if (!disposed) root.dataset.state = "error";
    });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("pointerdown", onPointerDown);
    reducedQuery.removeEventListener("change", onMotion);
    themeObserver.disconnect();
    resizeObserver.disconnect();
    visibility.disconnect();
    scene.dispose();
  };
}
