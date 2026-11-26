/**
 * READ FULL TEXT：HUD 锁定 · 描边解密。
 * 角标从屏幕四角收拢锁定档案盒；描边绕框一周作为解密进度；
 * 闭合后光框/角标扩张成文章页边界，HUD 层跨页保留，角标常驻文章页四角。
 */
import { navigate } from "astro:transitions/client";

type Rect = { x: number; y: number; w: number; h: number };
type Cfg = {
  move: number;
  lockAt: number;
  lock: number;
  traceAt: number;
  trace: number;
  label: boolean;
  hold: number;
  expand: number;
};

export const HUD_CFG: Record<"full" | "short", Cfg> = {
  // hold = 闭合闪光后多久发起导航。文章页在点击时就已开始下载（见 prefetchArticle），
  // 导航时只剩解析 + 换页（约 20~40ms），与 hold 一起构成设计稿「闭合后的停顿」200/60ms。
  full: { move: 620, lockAt: 280, lock: 420, traceAt: 700, trace: 520, label: true, hold: 160, expand: 520 },
  short: { move: 500, lockAt: 140, lock: 300, traceAt: 440, trace: 240, label: false, hold: 30, expand: 480 },
};

const E_OUT = "cubic-bezier(.16,1,.3,1)";
const E_LOCK = "cubic-bezier(.3,1.35,.5,1)";
const E_TRACE = "cubic-bezier(.45,0,.55,1)";
const PAD = 6;
const C = 16;
const GL = "01ABCDEF<>/#%_=+*".split("");

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const anim = (el: Element, keyframes: Keyframe[], duration: number, delay = 0, easing = "linear") =>
  el.animate(keyframes, { duration, delay, easing, fill: "both" });
const tr = (x: number, y: number) => `translate(${x}px,${y}px)`;

function pointOnRect(b: Rect, p: number): [number, number, number] {
  let d = p * 2 * (b.w + b.h);
  if (d <= b.w) return [b.x + d, b.y, 0];
  d -= b.w;
  if (d <= b.h) return [b.x + b.w, b.y + d, 1];
  d -= b.h;
  if (d <= b.w) return [b.x + b.w - d, b.y + b.h, 2];
  d -= b.w;
  return [b.x, b.y + b.h - d, 3];
}

const liveCorners = () => Array.from(document.querySelectorAll<HTMLElement>(".read-hud__c"));
const liveEdges = () => Array.from(document.querySelectorAll<HTMLElement>(".read-hud__edge"));

let active: Animation[] = [];
let cancelled = false;
let skipHandlers: { pointer: (e: Event) => void; key: (e: Event) => void } | null = null;
let lastContext: {
  url: string;
  b: Rect;
  corners: HTMLElement[];
  edges: HTMLElement[];
  label: HTMLElement;
  at: number[][];
  end: number[][];
  edgeAt: string[];
  edgeEnd: string[];
} | null = null;

/**
 * 点击 READ FULL TEXT 时就开始下载文章页，并让随后 ClientRouter 的那次请求直接复用结果。
 * <link rel="prefetch"> 在 HTML 不可缓存（dev server、多数静态托管的 HTML）时会被导航再请求一遍，
 * 这段网络等待原本落在「闭合后的停顿」里，表现为 DECRYPTED 定住不动。
 * 做法：在 astro:before-preparation 里包一层 loader，loader 执行期间只把这一个 URL 的 fetch
 * 换成早先的响应；解析、样式预加载、重定向检查等仍走 Astro 默认 loader。
 */
function prefetchArticle(url: string) {
  const target = new URL(url, location.href).href;
  const early: Promise<Response | null> = fetch(target, { credentials: "same-origin" })
    .then((res) => (res.ok ? res : null))
    .catch(() => null);
  const onPrepare = (event: Event) => {
    const e = event as Event & { to: URL; loader: () => Promise<void> };
    if (e.to.href !== target) return;
    document.removeEventListener("astro:before-preparation", onPrepare);
    const loader = e.loader;
    e.loader = async () => {
      const realFetch = window.fetch;
      let used = false;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const href = input instanceof Request ? input.url : String(input);
        if (!used && new URL(href, location.href).href === target) {
          used = true;
          const res = await early;
          if (res) return res.clone();
        }
        return realFetch(input, init);
      };
      try {
        await loader();
      } finally {
        window.fetch = realFetch;
      }
    };
  };
  document.addEventListener("astro:before-preparation", onPrepare);
  // 万一这次没有走 ClientRouter（降级为整页跳转），别让监听器留到下一次导航。
  window.setTimeout(() => document.removeEventListener("astro:before-preparation", onPrepare), 8000);
}

function removeSkipHandlers() {
  if (!skipHandlers) return;
  window.removeEventListener("pointerdown", skipHandlers.pointer, true);
  window.removeEventListener("keydown", skipHandlers.key, true);
  skipHandlers = null;
}

/** 全角乱码字符：给中文/全角字符占位，保证解码过程中每个字的宽度不变。 */
const GL_WIDE = "＃％＊＋／＝＜＞ＡＢＣＤＥＦ０１".split("");
const isWide = (ch: string) => /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch);

/** 文章页接入：只解码标题；色差收拢；正文对焦；目录淡入。 */
export function playArticleEntrance() {
  const h1 = document.querySelector<HTMLElement>("article h1");
  if (h1) {
    const text = h1.textContent ?? "";
    const chars = Array.from(text);
    // 解码期间锁住标题高度：乱码字符宽度与原文不同会改变换行，带着下面整篇正文上下跳。
    h1.style.minHeight = `${h1.offsetHeight}px`;
    const t0 = performance.now() + 60;
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 340));
      const k = Math.floor(p * chars.length);
      let s = chars.slice(0, k).join("");
      for (let j = k; j < chars.length; j++) {
        const ch = chars[j];
        if (/\s/.test(ch)) s += ch;
        else {
          const set = isWide(ch) ? GL_WIDE : GL;
          s += set[(Math.random() * set.length) | 0];
        }
      }
      h1.textContent = s;
      if (p < 1) requestAnimationFrame(step);
      else {
        h1.textContent = text;
        h1.style.minHeight = "";
      }
    };
    requestAnimationFrame(step);
    anim(
      h1,
      [
        { textShadow: "-2px 0 rgba(255,70,110,.45), 2px 0 rgba(40,190,255,.45)" },
        { textShadow: "0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0)" },
      ],
      320,
      60,
      "ease-out",
    );
  }
  const body = document.querySelector<HTMLElement>(".prose");
  if (body) {
    // 「对焦」用透明度 + 轻微位移表达：整篇正文做 blur 是全屏级别的逐帧重绘，
    // 正好压在光框扩张的那几帧上。
    const focus = anim(
      body,
      [{ opacity: 0.2, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      560,
      160,
      "cubic-bezier(.33,0,.15,1)",
    );
    // fill: both 会让 transform 一直留在正文上（建立层叠上下文，影响 sticky 目录等），播完即释放。
    void focus.finished.then(() => focus.cancel()).catch(() => {});
  }
  document.querySelectorAll<HTMLElement>(".toc-inline, .toc-card").forEach((toc) => {
    anim(toc, [{ opacity: 0 }, { opacity: 1 }], 400, 140, "ease-out");
  });
}

/**
 * 播放归档页 READ FULL TEXT 转场。
 * @param url 目标文章页
 * @param finalCaseRect 档案盒最终位姿在视口中的矩形
 * @param startCaseMotion 启动 3D 档案盒运镜
 */
export async function playArchiveRead(
  url: string,
  finalCaseRect: { x: number; y: number; width: number; height: number },
  startCaseMotion: (ms: number) => void,
) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    await navigate(url);
    return;
  }
  const hud = $("#read-hud");
  const corners = liveCorners();
  const edges = liveEdges();
  const svg = $<SVGSVGElement>(".read-hud__trace");
  const traceRect = svg?.querySelector("rect");
  if (!hud || corners.length < 4 || edges.length < 4 || !svg || !traceRect) {
    await navigate(url);
    return;
  }

  prefetchArticle(url);
  const first = !sessionStorage.getItem("blogyu:read-hud");
  sessionStorage.setItem("blogyu:read-hud", "1");
  const cfg = first ? HUD_CFG.full : HUD_CFG.short;
  cancelled = false;
  active = [];

  const vw = innerWidth;
  const vh = innerHeight;
  const navH = (document.querySelector(".site-nav") as HTMLElement | null)?.offsetHeight ?? 60;
  const b: Rect = {
    x: finalCaseRect.x - PAD,
    y: finalCaseRect.y - PAD,
    w: finalCaseRect.width + PAD * 2,
    h: finalCaseRect.height + PAD * 2,
  };
  const from = [[-24, -24], [vw + 8, -24], [-24, vh + 8], [vw + 8, vh + 8]];
  const at = [
    [b.x - 5, b.y - 5],
    [b.x + b.w - C + 5, b.y - 5],
    [b.x - 5, b.y + b.h - C + 5],
    [b.x + b.w - C + 5, b.y + b.h - C + 5],
  ];
  const end = [
    [16, navH + 8],
    [vw - C - 16, navH + 8],
    [16, vh - C - 16],
    [vw - C - 16, vh - C - 16],
  ];
  const edgeAt = [
    tr(b.x, b.y) + ` scaleX(${b.w / vw})`,
    tr(b.x, b.y + b.h) + ` scaleX(${b.w / vw})`,
    tr(b.x, b.y) + ` scaleY(${b.h / vh})`,
    tr(b.x + b.w, b.y) + ` scaleY(${b.h / vh})`,
  ];
  const edgeEnd = [
    tr(0, 0) + " scaleX(1)",
    tr(0, vh - 1.5) + " scaleX(1)",
    tr(0, 0) + " scaleY(1)",
    tr(vw - 1.5, 0) + " scaleY(1)",
  ];

  // 1) 3D 档案盒运镜
  startCaseMotion(cfg.move);

  // 2) 四角标从屏幕外收拢锁定
  corners.forEach((corner, i) => {
    active.push(
      anim(
        corner,
        [
          { opacity: 0, transform: tr(from[i][0], from[i][1]) },
          { opacity: 1, transform: tr(at[i][0], at[i][1]) },
        ],
        cfg.lock,
        cfg.lockAt + i * 25,
        E_LOCK,
      ),
    );
  });

  // 3) 描边绕行 = 解密进度
  const P = 2 * (b.w + b.h);
  traceRect.setAttribute("x", String(b.x));
  traceRect.setAttribute("y", String(b.y));
  traceRect.setAttribute("width", String(b.w));
  traceRect.setAttribute("height", String(b.h));
  traceRect.style.strokeDasharray = String(P);
  active.push(anim(svg, [{ opacity: 1 }, { opacity: 1 }], 1, cfg.traceAt));
  const trace = anim(traceRect, [{ strokeDashoffset: P }, { strokeDashoffset: 0 }], cfg.trace, cfg.traceAt, E_TRACE);
  active.push(trace);

  const label = $<HTMLElement>(".read-hud__label");
  let labelTick = 0;
  if (cfg.label) {
    active.push(anim(label, [{ opacity: 0 }, { opacity: 1 }], 120, cfg.traceAt));
    const offsets = [[0, -18], [10, -6], [-48, 8], [-52, -6]];
    const tick = () => {
      if (cancelled) return;
      const t = Number(trace.currentTime ?? 0) - cfg.traceAt;
      const lin = Math.min(1, Math.max(0, t / cfg.trace));
      const p = lin < 0.5 ? 2 * lin * lin : 1 - Math.pow(-2 * lin + 2, 2) / 2;
      const [x, y, side] = pointOnRect(b, p);
      label.style.transform = tr(x + offsets[side][0], y + offsets[side][1]);
      label.textContent = String(Math.round(p * 100)).padStart(3, "0") + "%";
      if (lin < 1) labelTick = requestAnimationFrame(tick);
    };
    labelTick = requestAnimationFrame(tick);
  }

  lastContext = { url, b, corners, edges, label, at, end, edgeAt, edgeEnd };
  const skip = () => skipArchiveRead(url, cfg);
  const onPointer = (e: Event) => { e.stopPropagation(); skip(); };
  const onKey = (e: Event) => { e.stopPropagation(); skip(); };
  skipHandlers = { pointer: onPointer, key: onKey };
  window.addEventListener("pointerdown", onPointer, true);
  window.addEventListener("keydown", onKey, true);

  await trace.finished.catch(() => {});
  if (cancelled) return;
  cancelAnimationFrame(labelTick);

  // 4) 闭合：光框闪一下，标签 DECRYPTED
  edges.forEach((edge, i) => {
    active.push(
      anim(
        edge,
        [
          { opacity: 1, transform: edgeAt[i], filter: "brightness(1.6)" },
          { opacity: 1, transform: edgeAt[i], filter: "brightness(1)" },
        ],
        260,
        0,
        "ease-out",
      ),
    );
  });
  active.push(anim(svg, [{ opacity: 0 }, { opacity: 0 }], 1));
  if (cfg.label) {
    label.textContent = "DECRYPTED";
    const [x, y] = pointOnRect(b, 0);
    label.style.transform = tr(x, y - 18);
    active.push(anim(label, [{ opacity: 1, letterSpacing: ".3em" }, { opacity: 1, letterSpacing: ".1em" }], 220, 0, E_OUT));
  }

  // 5) 停顿期间完成页面替换；替换后扩张
  await new Promise((r) => setTimeout(r, Math.max(0, cfg.hold)));
  if (cancelled) return;
  await finishArchiveRead(url, cfg, b, corners, edges, label, at, end, edgeAt, edgeEnd);
}

/** 闭合后的扩张 + 导航；skipArchiveRead 也复用它（用精简版扩张）。 */
async function finishArchiveRead(
  url: string,
  cfg: Cfg,
  b: Rect,
  corners: HTMLElement[],
  edges: HTMLElement[],
  label: HTMLElement,
  at: number[][],
  end: number[][],
  edgeAt: string[],
  edgeEnd: string[],
) {
  removeSkipHandlers();
  const root = document.documentElement;
  const vw = innerWidth;
  const vh = innerHeight;
  const clip = `inset(${b.y}px ${vw - b.x - b.w}px ${vh - b.y - b.h}px ${b.x}px)`;
  try {
    sessionStorage.setItem("blogyu:read-nav", "1");
    sessionStorage.setItem("blogyu:read-clip", clip);
    sessionStorage.setItem("blogyu:read-expand", String(cfg.expand));
  } catch (e) {}
  root.classList.add("read-nav");
  root.style.setProperty("--read-clip-from", clip);
  root.style.setProperty("--read-expand", `${cfg.expand}ms`);

  // 拿到本次导航的 ViewTransition：扩张必须等新页「首帧渲染 + 快照」完成（ready）后再开始，
  // 否则新页首帧的重活（约 60~80ms）会正好砸在扩张的第一帧上。
  let viewTransition: { ready: Promise<unknown> } | undefined;
  document.addEventListener(
    "astro:before-swap",
    (event) => {
      viewTransition = (event as Event & { viewTransition?: { ready: Promise<unknown> } }).viewTransition;
    },
    { once: true },
  );
  const afterNextPaint = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  document.addEventListener(
    "astro:after-swap",
    async () => {
      // 有 View Transition：等 ready（root 的裁切扩张也在这一刻开始，二者同步）；
      // 没有（降级/浏览器不支持）：等新页画完两帧再开始。
      if (viewTransition) await viewTransition.ready.catch(() => {});
      else await afterNextPaint();
      const cs = liveCorners();
      const es = liveEdges();
      cs.forEach((corner, i) => {
        anim(
          corner,
          [
            { opacity: 1, transform: tr(at[i]?.[0] ?? b.x, at[i]?.[1] ?? b.y) },
            { opacity: 0.6, transform: tr(end[i][0], end[i][1]) },
          ],
          cfg.expand,
          0,
          E_OUT,
        );
      });
      es.forEach((edge, i) => {
        anim(
          edge,
          [
            { opacity: 1, transform: edgeAt[i] },
            { opacity: 1, transform: edgeEnd[i], offset: 0.8 },
            { opacity: 0, transform: edgeEnd[i] },
          ],
          cfg.expand + 160,
          0,
          E_OUT,
        );
      });
      const liveLabel = $<HTMLElement>(".read-hud__label");
      if (liveLabel) anim(liveLabel, [{ opacity: 1 }, { opacity: 0 }], 200, 80, "ease-out");
      // 扩张第一帧要合成整页新快照，入场动画（标题解码等）推迟一帧再起，别挤在同一帧。
      requestAnimationFrame(() => playArticleEntrance());
      // 离开文章页时角标淡出
      document.addEventListener(
        "astro:before-preparation",
        () => {
          liveCorners().forEach((corner) => {
            corner.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "both" });
          });
          liveEdges().forEach((edge) => {
            edge.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both" });
          });
        },
        { once: true },
      );
    },
    { once: true },
  );

  const targetPath = new URL(url).pathname;
  const navPromise = navigate(url);
  // ClientRouter/View Transition 卡住时的硬兜底：至少保证进入文章页
  window.setTimeout(() => {
    if (location.pathname !== targetPath) window.location.assign(url);
  }, 800);
  await navPromise;
  window.setTimeout(() => root.classList.remove("read-nav"), cfg.expand + 500);
}

/** 播放中点击/按键：取消 HUD，直接用精简版扩张进入文章。 */
export function skipArchiveRead(url: string, _cfg: Cfg = HUD_CFG.short) {
  if (cancelled) return;
  cancelled = true;
  removeSkipHandlers();
  active.forEach((a) => a.cancel());
  const context = lastContext;
  lastContext = null;
  if (!context) {
    void navigate(url);
    return;
  }
  void finishArchiveRead(
    url,
    HUD_CFG.short,
    context.b,
    context.corners,
    context.edges,
    context.label,
    context.at,
    context.end,
    context.edgeAt,
    context.edgeEnd,
  );
}
