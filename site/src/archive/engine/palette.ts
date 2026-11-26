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
    /** 画布底色与雾色：比页面底色深一档，让白色玻璃档案浮起来 */
    paper: "#c6ddea",
    floor: "#6f8ea3",
    /** 环境光：天空 / 地面反光，主光 / 补光 / 轮廓光 */
    sky: "#e6f5ff",
    ground: "#4a687d",
    key: "#ffffff",
    fill: "#c7deed",
    rim: "#7cc7ea",
    /** 选中档案的聚光灯：冰蓝，保证在白色档案上也能看出光池 */
    spot: "#4fb4e0",
    /** 被抽出的那一份档案（完整材质） */
    polymer: "#f4fbff",
    polymerAttenuation: "#bcd6e4",
    ceramic: "#9fb2bd",
    label: "#e6eef2",
    edges: "#c7dde9",
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
    /** 阵列里密排的档案（简化材质）：不透明磨砂玻璃 */
    arrayPolymer: "#c9dfec",
    arrayDiffuser: "#10232f",
    arrayEdges: "#b4cfdf",
    arrayIndex: "#5fb6d8",
    /** 面板自下而上的明暗渐变（乘色）：底部沉在相邻档案的阴影里 */
    shadeLow: [0.05, 0.1, 0.16] as const,
    shadeHigh: [1.0, 1.0, 1.0] as const,
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
