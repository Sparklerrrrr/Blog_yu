/**
 * 三维场景的配色（博客版新增）。
 *
 * 原项目把暖象牙色直接写在 scene.ts / theme-material.ts / archive-lighting.ts 里；
 * 这里集中成一张表，并换成 BLOG_YU 的「冰川蓝」：
 *   - light 对应 tokens.css 的默认皮肤（--bg #e9f3f7 / --text #16303c / --accent #3f9bc2）
 *   - dark  对应 [data-theme="dark"]（--bg #0d1b22 / --text #cfe3ec / --accent #5fb6d8）
 * 明暗之间由 theme-material.ts 的着色器按卡片逐张过渡。
 */
export const PALETTE = {
  light: {
    /** 画布底色与雾色 = 页面底色 */
    paper: "#e9f3f7",
    floor: "#bfd2dd",
    /** 环境光：天空 / 地面反光，主光 / 补光 */
    sky: "#f6fbff",
    ground: "#8fa8b8",
    key: "#f3faff",
    fill: "#ffffff",
    /** 被抽出的那一份档案（完整材质） */
    polymer: "#fbfdff",
    polymerAttenuation: "#dfeaf0",
    ceramic: "#b6c3ca",
    label: "#e6eef2",
    edges: "#e3edf2",
    diffuser: "#d6e1e7",
    optics: "#a2b4be",
    opticalEdges: "#c0d0d9",
    filmEdge: "#8c9ca6",
    film: "#c3d2da",
    engraving: "#8697a2",
    engravingHighlight: "#dde8ee",
    lettering: "#c9d6dd",
    /** 强调色部件：编号嵌条 / 光学环 / 底部刻度 */
    indexInlay: "#3f9bc2",
    ring: "#3f9bc2",
    champagne: "#7ec8e3",
    /** 阵列里密排的档案（简化材质） */
    arrayPolymer: "#f2f9fd",
    arrayDiffuser: "#48667f",
    arrayEdges: "#eef7fb",
    arrayIndex: "#cfe2ec",
    /** 面板自下而上的明暗渐变（乘色）：底部沉在相邻档案的阴影里 */
    shadeLow: [0.2, 0.31, 0.4] as const,
    shadeHigh: [0.95, 0.985, 1.0] as const,
  },
  dark: {
    paper: "#0d1b22",
    floor: "#122630",
    mist: "#18303b",
    /** 暗色下各表面的目标颜色（按材质名） */
    surfaces: {
      Frosted_Polymer: "#586a75",
      Ivory_Edges: "#5f727d",
      Optical_Diffuser: "#12232c",
      Titanium_Fasteners: "#aebcc3",
      Index_Inlay: "#5fb6d8",
      Printed_Label: "#263842",
      Subsurface_Optics: "#8b9fa9",
      Optical_Edges: "#b3c4cc",
      Carbon_Ink: "#afc0c7",
    } as Record<string, string>,
    /** 表里没有的表面：强调色部件 / 其余 */
    accent: "#5fb6d8",
    fallback: "#8d9fa8",
    /** 标签在暗色下反相：深底 + 冷白字 */
    labelPaper: [0.02, 0.036, 0.046] as const,
    labelInk: [0.81, 0.89, 0.93] as const,
    polymerClear: [0.92, 0.96, 0.98] as const,
    subduedIndex: [0.03, 0.043, 0.05] as const,
  },
  /** 标签画布（浅色原稿，暗色由着色器反相） */
  labelCanvas: {
    paper: "#eef5f8",
    ink: "#16303c",
    muted: "#5d7683",
    accent: "#3f9bc2",
  },
} as const;

/** 材质名是否属于「强调色部件」（原项目按名字里的 Orange 判断，模型里实际叫 Amber / Champagne） */
export const isAccentSurface = (name: string) => /Amber|Champagne|Orange/.test(name);

export const glsl = (rgb: readonly [number, number, number]) =>
  `vec3(${rgb.map((v) => v.toFixed(3)).join(", ")})`;
