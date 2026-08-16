import { existsSync } from 'node:fs';

/** 曲目 */
export interface Track {
  title: string;
  artist: string;
  /** mp3 路径（放 public/music/ 下，如 '/music/xxx.mp3'） */
  src: string;
  /** 封面路径（可选，放 public/music/covers/ 下） */
  cover?: string;
}

/**
 * ============ 曲库（唯一数据源） ============
 * 加歌只需在这里加一行：把 mp3 放进 public/music/，
 * 封面放进 public/music/covers/，然后：
 *   { title: '歌名', artist: '歌手', src: '/music/文件名.mp3', cover: '/music/covers/封面.jpg' },
 * 播放器弹窗、播放列表都会自动更新。
 */
export const PLAYLIST: Track[] = [
  { title: 'Taipei (Tsundere Twintails Remix)', artist: 'Tsundere Twintails', src: '/music/taipei-remix.mp3', cover: '/music/covers/taipei.jpg' },
  { title: '春弦', artist: '塞壬唱片-MSR / 横山克', src: '/music/chunxian.mp3', cover: '/music/covers/chunxian.png' },
  { title: '直到大地变成一颗酸橙', artist: '塞壬唱片-MSR / 平林佑人 / 星熊南巫', src: '/music/suan-cheng.mp3', cover: '/music/covers/suan-cheng.jpg' },
  { title: 'Speed of Light', artist: '塞壬唱片-MSR / 喵斯快跑', src: '/music/speed-of-light.mp3', cover: '/music/covers/speed-of-light.jpg' },
  { title: 'Beautiful Things', artist: 'Simply Three', src: '/music/beautiful-things.mp3', cover: '/music/covers/beautiful-things.jpg' },
  { title: '焚蝶', artist: '铁痕电台-MSR / Aurora Sky', src: '/music/fen-die.mp3', cover: '/music/covers/fen-die.jpg' },
  { title: '宜', artist: '铁痕电台-MSR / 普阿山 / HeartStrings', src: '/music/yi.mp3', cover: '/music/covers/yi.jpg' },
];

// ---- 构建时校验：mp3 缺失立即在构建日志里警告（cwd 为 site/ 时有效） ----
for (const t of PLAYLIST) {
  if (!existsSync('public' + t.src)) {
    console.warn(`[music] ⚠ 找不到音频文件 public${t.src}（曲目：${t.title}）`);
  }
  if (t.cover && !existsSync('public' + t.cover)) {
    console.warn(`[music] ⚠ 找不到封面文件 public${t.cover}（曲目：${t.title}）`);
  }
}
