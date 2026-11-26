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
  renderer.toneMappingExposure = refined ? 0.9 : 0.92;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  // 环境贴图提供玻璃反射，但压低漫反射环境光，让主光塑造体积。
  scene.environmentIntensity = refined ? 0.95 : 0.9;
  scene.add(
    new THREE.HemisphereLight(
      PALETTE.light.sky,
      PALETTE.light.ground,
      refined ? 0.24 : 0.26,
    ),
  );
  // 主光放在镜头同侧前上方：照亮朝向观者的玻璃面，阴影落在后方。
  const key = new THREE.DirectionalLight(
    PALETTE.light.key,
    refined ? 2.15 : 2.0,
  );
  key.position.set(
    ...((refined ? [-8, 15, 6] : [-7, 15, 7]) as [number, number, number]),
  );
  // 背侧补光勾出档案盒轮廓，避免阵列边缘和背景糊在一起。
  const fill = new THREE.DirectionalLight(PALETTE.light.fill, refined ? 0.26 : 0.3);
  fill.position.set(8, 7, -9);
  // 冰蓝轮廓光：只打亮玻璃边缘和高光，不参与阴影。
  const rim = new THREE.DirectionalLight(PALETTE.light.rim, refined ? 0.66 : 0.8);
  rim.position.set(12, 4, 10);
  scene.add(key, fill, rim);
  return key;
}
