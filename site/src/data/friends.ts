/**
 * 友链数据：想添加/修改友链，改这个文件即可（friends.astro 自动渲染）。
 *
 * - group：分组 key，见下方 FRIEND_GROUPS（可自行扩展分组）
 * - tags ：卡片上的小标签，也参与页面的标签筛选
 */
export type FriendGroupId = 'blog' | 'community';

export const FRIEND_GROUPS: Record<FriendGroupId, { zh: string; en: string }> = {
  blog: { zh: '博客', en: 'BLOG' },
  community: { zh: '社区', en: 'COMMUNITY' },
};

export interface Friend {
  name: string;
  url: string;
  desc: string;
  icon: string;
  group: FriendGroupId;
  tags: string[];
}

export const friends: Friend[] = [
  {
    name: '清风博客',
    url: 'https://blog.myqfeng.top/',
    desc: '爱整活，爱生活——本站导航布局与音乐播放器的设计参考',
    icon: 'https://blog.myqfeng.top/assets/images/icon.png',
    group: 'blog',
    tags: ['Blog', '设计'],
  },
  {
    name: '070219.xyz',
    url: 'https://070219.xyz/',
    desc: '明月清风的小屋——本站选中高亮与浅色配色的参考',
    icon: 'https://070219.xyz/favicon.svg',
    group: 'blog',
    tags: ['Blog', '设计'],
  },
];
