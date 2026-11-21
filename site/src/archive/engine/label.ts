/**
 * 档案盒正面那张「印刷标签」的画法（博客版新增）。
 *
 * 原项目在 scene.ts 里画的是「RHINE LAB, LLC. / INTERNAL DATABASE / NO.001」和莱茵生命标志；
 * 那些是《明日方舟》相关标识，不在其 MIT 授权范围内，也不是这个博客的东西。
 * 这里换成 BLOG_YU 自己的字样与「//」记号（站内到处都在用的分隔符），版式比例保持不变。
 *
 * 画布固定 1024 × 440，浅色原稿；暗色主题由 theme-material.ts 的着色器按亮度反相。
 */
import { PALETTE } from "./palette";
import { records } from "./data";

/** 与站点字体一致；Google Fonts 没加载到时回退到系统等宽字体 */
export const LABEL_FONT = '"JetBrains Mono", "Noto Sans SC", ui-monospace, monospace';

function drawMark(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const bar = w * 0.16;
  const lean = w * 0.2;
  const gap = w * 0.25;
  c.fillStyle = PALETTE.labelCanvas.ink;
  for (let i = 0; i < 2; i++) {
    const left = x + i * gap;
    c.beginPath();
    c.moveTo(left + lean, y);
    c.lineTo(left + lean + bar, y);
    c.lineTo(left + bar, y + h);
    c.lineTo(left, y + h);
    c.closePath();
    c.fill();
  }
  const dot = h * 0.42;
  c.fillStyle = PALETTE.labelCanvas.accent;
  c.fillRect(x + w - dot, y + h - dot, dot, dot);
}

export function drawArchiveLabel(c: CanvasRenderingContext2D, index: number) {
  const { paper, ink, muted } = PALETTE.labelCanvas;
  const record = records[index];
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  c.fillStyle = paper;
  c.fillRect(0, 0, 1024, 440);
  c.fillStyle = ink;
  c.fillRect(12, 12, 1000, 6);
  c.fillRect(12, 419, 1000, 3);
  c.font = `bold 81px ${LABEL_FONT}`;
  c.fillText("BLOG_YU", 22, 116);
  c.font = `32px ${LABEL_FONT}`;
  c.fillStyle = muted;
  c.fillText("ARTICLE ARCHIVE", 25, 174);
  c.fillStyle = ink;
  c.font = `bold 130px ${LABEL_FONT}`;
  c.fillText("NO." + String(record?.no ?? index + 1).padStart(3, "0"), 22, 360);
  // 右上角：分类色块 + FILE
  c.fillRect(782, 32, 221, 39);
  c.fillStyle = paper;
  c.font = `bold 24px ${LABEL_FONT}`;
  c.textAlign = "center";
  c.fillText((record?.categoryEn ?? "ARCHIVE").slice(0, 12), 892.5, 60);
  c.textAlign = "left";
  c.fillStyle = ink;
  c.font = `bold 64px ${LABEL_FONT}`;
  c.fillText("FILE", 830, 143);
  drawMark(c, 790, 242, 210, 98);
}
