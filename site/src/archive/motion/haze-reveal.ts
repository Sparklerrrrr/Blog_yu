/**
 * 归档详情右栏的逐行朦胧揭示。
 * 3px / 1.2px 双层，20% 背景薄雾；1150ms/行、120ms 错开（2026-11-25 由 700/90 放慢）。
 *
 * 开场：详情栏 0.15s 后开始淡入（0.3s），遮蔽条随之出现并静止停留，
 * 打开后 800ms 才开始逐行消散——先让用户看清「被遮蔽」的状态，再揭示。
 *
 * 不改动行内原有结构：只往行里追加两个绝对定位的遮罩层（不参与 flex/grid 布局），
 * 焦点呼吸直接作用在行元素本身。揭示结束后遮罩层移除，行元素恢复原样。
 *
 * 节奏说明：遮罩前沿真正扫过文字的区间是 --rv-p ≈ -48% → 100%。
 * 原来的强 ease-out 曲线把这段压在每行开头约 230ms 内，用户只看到「闪一下」；
 * 现在用中段平缓的曲线，浓雾前沿在每行文字上可见地走约 550ms，7 行约 2.7s 内全部清晰。
 */

export const HAZE = {
  lineDuration: 1150,
  lineStagger: 120,
  startDelay: 800,
  /** 遮罩前沿起止（-50% 时两层刚好完全盖住整行；106% 时两层都已完全离开） */
  from: "-50%",
  to: "106%",
  breathScale: 1.012,
  easing: "cubic-bezier(.3,.12,.32,1)",
} as const;

/** 给每一行插入两层朦胧遮罩（不包裹、不移动原有子节点）。 */
export function prepareHaze(lines: HTMLElement[]) {
  for (const line of lines) {
    if (line.classList.contains("rv-line")) continue;
    const soft = document.createElement("span");
    soft.className = "rv-haze-soft";
    soft.setAttribute("aria-hidden", "true");
    const strong = document.createElement("span");
    strong.className = "rv-haze-strong";
    strong.setAttribute("aria-hidden", "true");
    line.classList.add("rv-line");
    line.append(soft, strong);
  }
}

/** 播放逐行揭示；返回的 Promise 在全部行完成后 resolve。 */
export function playHaze(lines: HTMLElement[]): Promise<void> {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cleanupHaze(lines);
    return Promise.resolve();
  }
  const anims: Animation[] = [];
  lines.forEach((line, i) => {
    line.getAnimations().forEach((a) => a.cancel());
    const delay = HAZE.startDelay + i * HAZE.lineStagger;
    anims.push(
      line.animate(
        [{ "--rv-p": HAZE.from }, { "--rv-p": HAZE.to }] as Keyframe[],
        { duration: HAZE.lineDuration, delay, easing: HAZE.easing, fill: "both" },
      ),
    );
    // 焦点呼吸：行本身从 101.2% 缩回 100%（transform 不影响布局）。
    anims.push(
      line.animate(
        [{ transform: `scale(${HAZE.breathScale})` }, { transform: "none" }],
        {
          duration: HAZE.lineDuration,
          delay: delay + HAZE.lineDuration * 0.25,
          easing: HAZE.easing,
          fill: "backwards",
        },
      ),
    );
  });
  return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => cleanupHaze(lines));
}

/** 揭示完成后移除遮罩，不留 backdrop-filter 常驻。 */
export function cleanupHaze(lines: HTMLElement[]) {
  for (const line of lines) {
    line.querySelectorAll(":scope > .rv-haze-soft, :scope > .rv-haze-strong").forEach((n) => n.remove());
    line.getAnimations().forEach((a) => a.cancel());
    line.style.removeProperty("--rv-p");
    line.classList.remove("rv-line");
  }
}
