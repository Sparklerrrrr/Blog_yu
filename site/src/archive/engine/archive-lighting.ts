/**
 * 移植自 RhineLabUI（https://github.com/LBEILC/RhineLabUI，src/archive-lighting.ts）
 * Copyright (c) 2026 LBEILC，MIT License —— 许可全文见 ../NOTICE.md。
 * 博客版改动：灯光颜色取自 ./palette（暖白改为冷白），强度与位置未动。
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PALETTE } from "./palette";

export type LightingLook = "baseline" | "refined";

// The archive and its independent viewer use the same studio illumination.
// Each renderer needs its own PMREM render target / WebGL texture.
export function createArchiveLighting(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  look: LightingLook = "baseline",
) {
  const refined = look === "refined";
  renderer.toneMappingExposure = refined ? 1.0 : 1.05;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environmentIntensity = refined ? 0.52 : 0.48;
  scene.add(
    new THREE.HemisphereLight(
      PALETTE.light.sky,
      PALETTE.light.ground,
      refined ? 0.5 : 0.65,
    ),
  );
  const key = new THREE.DirectionalLight(
    PALETTE.light.key,
    refined ? 1.7 : 1.4,
  );
  key.position.set(
    ...((refined ? [-8, 14, 4] : [-6, 14, -5]) as [number, number, number]),
  );
  const fill = new THREE.DirectionalLight(PALETTE.light.fill, refined ? 0.3 : 0.6);
  fill.position.set(7, 8, -10);
  scene.add(key, fill);
  return key;
}
