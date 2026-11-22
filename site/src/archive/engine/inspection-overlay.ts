/**
 * 解密时叠在档案盒上的对角扫描线、四角标记与中心点。
 *
 * 移植自 RhineLabUI（https://github.com/LBEILC/RhineLabUI，src/inspection-overlay.ts）
 * Copyright (c) 2026 LBEILC，MIT License —— 许可全文见 ../NOTICE.md。
 * 博客版改动：不再用全局 id 查找元素，改为由调用方传入（页面里可能还有别的 SVG）。
 */
import {
  SCAN_FROM,
  SCAN_TO,
  SCAN_CORNERS,
  type DecryptionFrame,
} from "./decryption";

export function inspectionSegments(frame: DecryptionFrame) {
  const point = (t: number): [number, number] => [
    SCAN_FROM[0] + (SCAN_TO[0] - SCAN_FROM[0]) * t,
    SCAN_FROM[1] + (SCAN_TO[1] - SCAN_FROM[1]) * t,
  ];
  return frame.intervals.map(([a, b]) => [point(a), point(b)] as const);
}

export class InspectionOverlay {
  private line: SVGPathElement;
  private corners: SVGGElement;
  private point: SVGCircleElement;

  /**
   * @param root  覆盖在三维画布上的 SVG，内含 [data-inspection="lines|corners|point"]
   * @param host  三维画布的容器（用它的尺寸做 viewBox，坐标与 scene.projectCard 一致）
   */
  constructor(
    private root: SVGSVGElement,
    private host: HTMLElement,
  ) {
    this.line = root.querySelector<SVGPathElement>('[data-inspection="lines"]')!;
    this.corners = root.querySelector<SVGGElement>('[data-inspection="corners"]')!;
    this.point = root.querySelector<SVGCircleElement>('[data-inspection="point"]')!;
  }

  render(
    frame: DecryptionFrame,
    project: (x: number, y: number) => number[],
    enabled = true,
  ) {
    this.root.setAttribute("viewBox", `0 0 ${this.host.clientWidth} ${this.host.clientHeight}`);
    this.root.style.opacity =
      enabled && (frame.intervals.length || frame.markers > 0 || frame.point > 0)
        ? "1"
        : "0";
    this.root.dataset.phase = frame.phase;
    this.line.setAttribute(
      "d",
      inspectionSegments(frame)
        .map(([a, b]) => `M${project(...a)}L${project(...b)}`)
        .join(""),
    );
    this.corners.style.opacity = String(frame.markers);
    this.corners.innerHTML =
      frame.markers > 0
        ? SCAN_CORNERS.map(([x, y]) => {
            const [px, py] = project(x, y);
            return `<rect x="${px - 4}" y="${py - 4}" width="8" height="8"/>`;
          }).join("")
        : "";
    const [cx, cy] = project(
      (SCAN_FROM[0] + SCAN_TO[0]) / 2,
      (SCAN_FROM[1] + SCAN_TO[1]) / 2,
    );
    this.point.setAttribute("cx", String(cx));
    this.point.setAttribute("cy", String(cy));
    this.point.style.opacity = String(frame.point);
  }
}
