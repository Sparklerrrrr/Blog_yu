/**
 * 动效开关：场景按这些键决定每一类动画是「完整播放」还是「直接到位」。
 *
 * 移植自 RhineLabUI（https://github.com/LBEILC/RhineLabUI，src/motion-preferences.ts）
 * Copyright (c) 2026 LBEILC，MIT License —— 许可全文见 ../NOTICE.md。
 * 博客版改动：只保留类型与「完整 / 减少」两套预设，去掉了原项目设置面板的文案与标记。
 */
export type MotionKey =
  | "boot"
  | "selectionWave"
  | "idleWave"
  | "pointerParallax"
  | "dragMomentum"
  | "selectionTransition"
  | "detailTransition"
  | "modelDecryption"
  | "documentReveal"
  | "rollingText"
  | "rollingNumbers"
  | "surfaceTransitions"
  | "viewerNavigation"
  | "viewerModelTransition";

export type MotionPreferences = Record<MotionKey, boolean>;

const preset = (value: boolean): MotionPreferences => ({
  boot: value,
  selectionWave: value,
  idleWave: value,
  pointerParallax: value,
  dragMomentum: value,
  selectionTransition: value,
  detailTransition: value,
  modelDecryption: value,
  documentReveal: value,
  rollingText: value,
  rollingNumbers: value,
  surfaceTransitions: value,
  viewerNavigation: value,
  viewerModelTransition: value,
});

export function fullMotion(): MotionPreferences {
  return preset(true);
}

/** 对应系统的「减少动态效果」：镜头、波浪、揭示全部直接到位 */
export function reducedMotion(): MotionPreferences {
  return preset(false);
}
