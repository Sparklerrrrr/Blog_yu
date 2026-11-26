/**
 * ============ 服务（唯一数据源） ============
 * 加服务：在 SERVICES 数组加一条即可，/services/ 页面自动渲染。
 */
export interface Service {
  /** 服务名 */
  name: string;
  /** 一句话说明 */
  desc: string;
  /** 要点列表（3 条左右） */
  features: string[];
  /** 标签 */
  tags: string[];
  /** 合作方式 / 交付说明 */
  note: string;
  /** 站内服务入口；填了之后整张卡片可点击跳转 */
  url?: string;
}

export const SERVICES: Service[] = [
  {
    name: '订阅转换',
    desc: '把订阅链接或节点链接转换成 Mihomo、Surge、sing-box 等客户端配置，支持 CF 优选 IP 批量替换。',
    features: ['20+ 客户端格式、按订阅设置 Provider 与诊断', 'CF 优选 IP 替换（附 CloudflareSpeedTest 优选器指引）', '订阅预览、二维码与一键复制'],
    tags: ['SubConverter', 'Mihomo', 'CF 优选'],
    note: '点击卡片进入转换器',
    url: '/services/subconverter/',
  },
  {
    name: '网站搭建与部署',
    desc: 'Astro / 静态站 / 博客与个人主页，从设计到上线一条龙。',
    features: ['响应式布局与主题定制', '域名解析、HTTPS、CDN 与备案协助', '性能优化与 SEO 基础配置'],
    tags: ['Astro', '前端', '部署'],
    note: '按项目报价，源码与文档交付',
  },
  {
    name: '技术咨询与排障',
    desc: '前端工程、构建工具、Linux 运维的疑难杂症，按小时或按问题计。',
    features: ['问题定位与修复方案', '代码评审与重构建议', '一对一远程协助'],
    tags: ['咨询', '运维', '排障'],
    note: '先评估再报价，解决不了不收钱',
  },
  {
    name: 'AI 工具集成',
    desc: '把大模型能力接进你的工作流：文档问答、内容生成、自动化脚本。',
    features: ['API 接入与提示词调优', 'RAG 知识库搭建', 'Agent 自动化小工具'],
    tags: ['AI', 'LLM', '自动化'],
    note: '按需求评估，交付可运行方案',
  },
];
