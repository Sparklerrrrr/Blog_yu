/**
 * 移植自 RhineLabUI（https://github.com/LBEILC/RhineLabUI，src/theme-material.ts）
 * Copyright (c) 2026 LBEILC，MIT License —— 许可全文见 ../NOTICE.md。
 * 博客版改动：暗色主题的目标颜色取自 ./palette（博客的暗色冰川），强调色部件按模型里的实际材质名识别。
 */
import * as THREE from "three";
import { PALETTE, glsl, isAccentSurface } from "./palette";

const night = PALETTE.dark;
const surfaces = night.surfaces;
/** Extend existing optical shaders; one float per instance avoids new meshes or passes. */
export function themeMaterial(material: THREE.Material, name: string, instanced = false, subduedIndex = { value: 0 }) {
  const amount = { value: 0 };
  const before = material.onBeforeCompile;
  const cache = material.customProgramCacheKey.bind(material)();
  const color = new THREE.Color(surfaces[name] ?? (isAccentSurface(name) ? night.accent : night.fallback));
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    shader.uniforms.rhineTheme = amount;
    shader.uniforms.rhineDarkSurface = { value: color };
    shader.uniforms.rhineSubduedIndex = subduedIndex;
    if (instanced) {
      shader.vertexShader = "attribute float archiveTheme; varying float vRhineTheme;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvRhineTheme = archiveTheme;");
      shader.fragmentShader = "varying float vRhineTheme;\n" + shader.fragmentShader;
    }
    shader.fragmentShader = "uniform float rhineTheme; uniform vec3 rhineDarkSurface; uniform float rhineSubduedIndex;\n" + shader.fragmentShader;
    const mix = instanced ? "vRhineTheme" : "rhineTheme";
    const printed = name === "Printed_Canvas";
    const anchor = printed ? "#include <opaque_fragment>" : "#include <roughnessmap_fragment>";
    const dark = printed
      ? `mix(${glsl(night.labelPaper)}, ${glsl(night.labelInk)}, 1.0 - smoothstep(0.12, 0.65, dot(diffuseColor.rgb, vec3(.2126,.7152,.0722))))`
      : name === "Frosted_Polymer" && !instanced
        ? `mix(rhineDarkSurface, ${glsl(night.polymerClear)}, glassRevealAtHeight(archiveClarity, vArchiveHeight))`
        : name === "Index_Inlay" ? `mix(rhineDarkSurface, ${glsl(night.subduedIndex)}, rhineSubduedIndex)` : "rhineDarkSurface";
    const output = printed ? "outgoingLight" : "diffuseColor.rgb";
    shader.fragmentShader = shader.fragmentShader.replace(anchor, `${output} = mix(${output}, ${dark}, ${mix});\n${anchor}`);
  };
  material.customProgramCacheKey = () => `${cache}-rhine-theme-${name}-${instanced}`;
  return amount;
}

type Baseline = { background: THREE.Color; fog?: THREE.Color; intensity: number; exposure: number; lights: { light: THREE.Light; intensity: number }[]; floor?: { material: THREE.MeshStandardMaterial; color: THREE.Color } };
const scenes = new WeakMap<THREE.Scene, Baseline>();
const background = new THREE.Color(night.paper), floorColor = new THREE.Color(night.floor), mistColor = new THREE.Color(night.mist);
export function themeEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer, amount: number) {
  let baseline = scenes.get(scene);
  if (!baseline) {
    const lights: Baseline["lights"] = [];
    scene.traverse(object => { if (object instanceof THREE.Light) lights.push({ light: object, intensity: object.intensity }); });
    const floor = scene.getObjectByName("archive-floor") as THREE.Mesh | undefined;
    const material = floor?.material as THREE.MeshStandardMaterial | undefined;
    baseline = { background: (scene.background as THREE.Color).clone(), fog: scene.fog?.color.clone(), intensity: scene.environmentIntensity,
      exposure: renderer.toneMappingExposure, lights, floor: material ? { material, color: material.color.clone() } : undefined };
    scenes.set(scene, baseline);
  }
  (scene.background as THREE.Color).copy(baseline.background).lerp(background, amount);
  if (scene.fog && baseline.fog) scene.fog.color.copy(baseline.fog).lerp(mistColor, amount);
  if (baseline.floor) baseline.floor.material.color.copy(baseline.floor.color).lerp(floorColor, amount);
  scene.environmentIntensity = THREE.MathUtils.lerp(baseline.intensity, .32, amount);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(baseline.exposure, .98, amount);
  for (const { light, intensity } of baseline.lights) light.intensity = intensity * (1 - .35 * amount);
}
