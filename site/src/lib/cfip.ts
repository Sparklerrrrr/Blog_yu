/**
 * CF 优选 IP 替换：把用户自己的节点 × 优选 IP/域名 展开成多条克隆节点。
 *
 * 原理：CF 的任意边缘 IP 都能接入同一个 CF 账户下的站点，真正决定落到哪个源站的是
 * TLS 的 SNI 与 WebSocket 的 Host 头。所以只替换「连接地址/端口」，原域名留作 Host/SNI。
 *
 * 纯浏览器代码：不依赖 Node API，不引第三方库；全部在本地完成，节点信息不离开页面（直到用户自己点转换）。
 */

export interface Endpoint {
  host: string;
  port?: number;
  remark?: string;
}

export type NodeKind = 'vmess' | 'vless' | 'trojan';

export interface ParsedNode {
  kind: NodeKind;
  name: string;
  server: string;
  port: number;
  host?: string;
  sni?: string;
  raw: string;
  /** REALITY 的 pbk/sid 绑定真实服务器，不能换地址 */
  reality?: boolean;
  /** vmess：原始 JSON 对象，重建时整体保留未知字段 */
  _vmess?: Record<string, unknown>;
  /** vless/trojan：重建 URL 所需的原始片段 */
  _url?: { user: string; path: string; params: Array<[string, string]> };
}

export interface ExpandOptions {
  prefix?: string;
  keepHostSni?: boolean;
  maxOutput?: number;
}

export interface PreviewRow {
  name: string;
  kind: string;
  server: string;
  port: number;
  host: string;
  sni: string;
}

const MAX_ENDPOINTS = 50;
const PREVIEW_ROWS = 20;

/* ---------------- base64（UTF-8 安全） ---------------- */

/** atob 只认 Latin-1，中文要先经 TextEncoder 转字节 */
export function b64encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/** 兼容标准/URL-safe、有无 padding；解码失败或不是合法 UTF-8 时返回 null */
export function b64decode(input: string): string | null {
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!s || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  s = s.replace(/=+$/, '');
  if (s.length % 4 === 1) return null;
  s += '='.repeat((4 - (s.length % 4)) % 4);
  try {
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/* ---------------- 地址判断 ---------------- */

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/i;

function isIPv4(h: string): boolean {
  return IPV4_RE.test(h);
}

/** 借浏览器自带的 URL 解析校验 IPv6，比手写正则可靠 */
function isIPv6(h: string): boolean {
  if (!h.includes(':') || !/^[0-9a-f:.]+$/i.test(h)) return false;
  try {
    new URL(`http://[${h}]/`);
    return true;
  } catch {
    return false;
  }
}

/** 是否为 IP 字面量（IPv6 可带方括号） */
export function isIpLiteral(host: string): boolean {
  const h = host.trim().replace(/^\[(.*)\]$/, '$1');
  return isIPv4(h) || isIPv6(h);
}

function isValidHost(h: string): boolean {
  return isIPv4(h) || isIPv6(h) || DOMAIN_RE.test(h);
}

/** URL 里 IPv6 必须加方括号 */
function fmtHost(h: string): string {
  return isIPv6(h) ? `[${h}]` : h;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parsePort(s: string): number | null {
  if (!/^\d{1,5}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 65535 ? n : null;
}

/* ---------------- 优选端点 ---------------- */

/** 拆 host[:port]，IPv6 用方括号区分端口；无方括号的 IPv6 视为不带端口 */
function splitHostPort(s: string): { host: string; portStr?: string } | null {
  const v6 = s.match(/^\[([^\]]+)\](?::(.*))?$/);
  if (v6) return { host: v6[1], portStr: v6[2] };
  if ((s.match(/:/g) || []).length >= 2) return { host: s };
  const i = s.lastIndexOf(':');
  return i < 0 ? { host: s } : { host: s.slice(0, i), portStr: s.slice(i + 1) };
}

/** 词的 # 前部分是不是合法地址；不是的话当作上一条备注的一部分 */
function looksLikeAddr(w: string): boolean {
  const hp = w.split('#')[0];
  const split = hp ? splitHostPort(hp) : null;
  return !!split && isValidHost(split.host.toLowerCase());
}

/** CloudflareSpeedTest 的 result.csv：首列 IP，第 5 列平均延迟，第 6 列下载速度 */
function parseSpeedTestCsv(lines: string[], warnings: string[]): Endpoint[] {
  const out: Endpoint[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map((c) => c.trim());
    if (!cols[0]) continue;
    const host = cols[0].replace(/^\[(.*)\]$/, '$1');
    if (!isIPv4(host) && !isIPv6(host)) {
      warnings.push(`CSV 行无法识别：${line}`);
      continue;
    }
    const lat = parseFloat(cols[4]);
    const speed = parseFloat(cols[5]);
    const parts: string[] = [];
    if (Number.isFinite(lat)) parts.push(`${Math.round(lat)}ms`);
    if (Number.isFinite(speed) && speed > 0) parts.push(`${Math.round(speed * 10) / 10}MB/s`);
    out.push({ host, remark: parts.join(' · ') || undefined });
  }
  return out;
}

export function parseEndpoints(text: string): { endpoints: Endpoint[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));

  let candidates: Endpoint[] = [];
  if (lines.length && /^(IP 地址|IP Address)/i.test(lines[0])) {
    candidates = parseSpeedTestCsv(lines, warnings);
  } else {
    const tokens: string[] = [];
    for (const line of lines) {
      for (const seg of line.split(/[,;，；]/)) {
        // 先按空白拆，再把备注里的空格拼回去：「1.1.1.1 2.2.2.2#Hong Kong」要得到两个地址
        const cur: string[] = [];
        for (const w of seg.trim().split(/\s+/)) {
          if (!w) continue;
          const last = cur.length - 1;
          if (last >= 0 && w.startsWith('#') && !cur[last].includes('#')) cur[last] += w;
          else if (last >= 0 && cur[last].includes('#') && !looksLikeAddr(w)) cur[last] += ' ' + w;
          else cur.push(w);
        }
        tokens.push(...cur);
      }
    }
    for (const tok of tokens) {
      const hash = tok.indexOf('#');
      const hp = (hash < 0 ? tok : tok.slice(0, hash)).trim();
      const remark = hash < 0 ? '' : safeDecode(tok.slice(hash + 1).trim());
      const split = splitHostPort(hp);
      const host = split?.host.toLowerCase() ?? '';
      if (!split || !isValidHost(host)) {
        warnings.push(`无法识别的地址：${tok}`);
        continue;
      }
      let port: number | undefined;
      if (split.portStr !== undefined) {
        const p = parsePort(split.portStr);
        if (p === null) {
          warnings.push(`端口无效（应为 1-65535）：${tok}`);
          continue;
        }
        port = p;
      }
      candidates.push({ host, port, remark: remark || undefined });
    }
  }

  // 同一 host+port 只留第一条
  const seen = new Set<string>();
  const endpoints: Endpoint[] = [];
  for (const e of candidates) {
    const key = `${e.host.toLowerCase()}|${e.port ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    endpoints.push(e);
  }
  if (endpoints.length > MAX_ENDPOINTS) {
    warnings.push(`优选地址共 ${endpoints.length} 个，只取前 ${MAX_ENDPOINTS} 个`);
    endpoints.length = MAX_ENDPOINTS;
  }
  return { endpoints, warnings };
}

/* ---------------- 节点解析 ---------------- */

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):\/\//i;

function str(v: unknown): string {
  return v === undefined || v === null ? '' : String(v);
}

function parseVmess(raw: string): ParsedNode | string {
  const body = raw.slice('vmess://'.length).split('#')[0];
  const json = b64decode(body);
  if (json === null) return 'vmess 内容不是 base64 JSON（可能是 Shadowrocket 格式）';
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json);
  } catch {
    return 'vmess JSON 解析失败';
  }
  if (!obj || typeof obj !== 'object') return 'vmess JSON 格式不对';
  const server = str(obj.add).trim().replace(/^\[(.*)\]$/, '$1');
  const port = parsePort(str(obj.port).trim());
  if (!server || port === null) return 'vmess 缺少地址或端口';
  return {
    kind: 'vmess',
    name: str(obj.ps) || server,
    server,
    port,
    host: str(obj.host) || undefined,
    sni: str(obj.sni) || undefined,
    raw,
    _vmess: obj,
  };
}

/** 手动拆 URL：不同浏览器对非特殊协议的 URL 解析并不一致，手拆最稳 */
function parseUrlNode(raw: string, kind: 'vless' | 'trojan'): ParsedNode | string {
  let s = raw.slice(kind.length + 3);
  let name = '';
  const hash = s.indexOf('#');
  if (hash >= 0) {
    name = safeDecode(s.slice(hash + 1));
    s = s.slice(0, hash);
  }
  let query = '';
  const q = s.indexOf('?');
  if (q >= 0) {
    query = s.slice(q + 1);
    s = s.slice(0, q);
  }
  const at = s.lastIndexOf('@');
  if (at <= 0) return `${kind} 缺少用户 ID/密码`;
  const user = s.slice(0, at);
  let rest = s.slice(at + 1);
  let path = '';
  const slash = rest.indexOf('/');
  if (slash >= 0) {
    path = rest.slice(slash);
    rest = rest.slice(0, slash);
  }
  const v6 = rest.match(/^\[([^\]]+)\]:(\d+)$/);
  const m = v6 ?? rest.match(/^([^:]+):(\d+)$/);
  const port = m ? parsePort(m[2]) : null;
  if (!m || port === null) return `${kind} 地址或端口无效`;
  const server = m[1];

  // 值保留原样（未解码）：解码再编码会把 + 变成 %2B、把坏掉的 %xx 二次编码，改变原意
  const params: Array<[string, string]> = [];
  for (const kv of query.split('&')) {
    if (!kv) continue;
    const eq = kv.indexOf('=');
    params.push(eq < 0 ? [kv, ''] : [kv.slice(0, eq), kv.slice(eq + 1)]);
  }
  const get = (k: string) => safeDecode(params.find(([key]) => key === k)?.[1] ?? '');
  return {
    kind,
    name: name || server,
    server,
    port,
    host: get('host') || undefined,
    // trojan 老格式用 peer 表示 SNI
    sni: get('sni') || get('peer') || undefined,
    raw,
    reality: get('security').toLowerCase() === 'reality',
    _url: { user, path, params },
  };
}

function parseLink(line: string): ParsedNode | string {
  const scheme = line.match(SCHEME_RE)![1].toLowerCase();
  if (scheme === 'vmess') return parseVmess(line);
  if (scheme === 'vless' || scheme === 'trojan') return parseUrlNode(line, scheme);
  return `暂不支持 ${scheme}:// 协议`;
}

export function parseNodes(text: string): { nodes: ParsedNode[]; skipped: string[]; warnings: string[] } {
  const nodes: ParsedNode[] = [];
  const skipped: string[] = [];
  const warnings: string[] = [];

  const shorten = (s: string) => (s.length > 60 ? s.slice(0, 57) + '...' : s);

  const walk = (input: string, depth: number) => {
    const lines = input
      .replace(/^﻿/, '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    // 订阅内容常被按 76 列折行，整体都不含 :// 时先当一整块 base64 试
    if (depth === 0 && lines.length > 1 && !input.includes('://')) {
      const dec = b64decode(lines.join(''));
      if (dec !== null && dec.includes('://')) return walk(dec, depth + 1);
    }
    for (const line of lines) {
      if (SCHEME_RE.test(line)) {
        const r = parseLink(line);
        if (typeof r === 'string') skipped.push(`${shorten(line)} —— ${r}`);
        else nodes.push(r);
        continue;
      }
      // 只展开一层，避免恶意内容无限嵌套
      const dec = depth === 0 ? b64decode(line) : null;
      if (dec !== null && dec.includes('://')) walk(dec, depth + 1);
      else skipped.push(`${shorten(line)} —— 无法识别`);
    }
  };
  walk(text, 0);

  if (!nodes.length && !skipped.length) warnings.push('没有输入节点');
  return { nodes, skipped, warnings };
}

/* ---------------- 展开 ---------------- */

function buildVmess(node: ParsedNode, ep: Endpoint, port: number, host: string, sni: string, name: string): string {
  const obj: Record<string, unknown> = { ...node._vmess! };
  obj.ps = name;
  obj.add = ep.host;
  // 保持原 port 字段的类型（有的客户端只认字符串）
  obj.port = typeof obj.port === 'string' ? String(port) : port;
  if (host) obj.host = host;
  if (sni) obj.sni = sni;
  return 'vmess://' + b64encode(JSON.stringify(obj));
}

function buildUrl(node: ParsedNode, ep: Endpoint, port: number, host: string, sni: string, name: string): string {
  const u = node._url!;
  const params = u.params.map(([k, v]) => [k, v] as [string, string]);
  // params 里是原样的值，新填的要自己编码
  const setIfEmpty = (k: string, v: string) => {
    if (!v) return;
    const hit = params.find(([key]) => key === k);
    if (!hit) params.push([k, encodeURIComponent(v)]);
    else if (!hit[1]) hit[1] = encodeURIComponent(v);
  };
  setIfEmpty('host', host);
  // 已用 peer 表示 SNI 的 trojan 不再额外加 sni
  if (!params.some(([k, v]) => k === 'peer' && v)) setIfEmpty('sni', sni);
  // | 是 SubConverter url= 的分隔符，原样片段里出现的必须转义
  const esc = (s: string) => s.replace(/\|/g, '%7C');
  const qs = params.map(([k, v]) => `${esc(k)}=${esc(v)}`).join('&');
  return (
    `${node.kind}://${esc(u.user)}@${fmtHost(ep.host)}:${port}${esc(u.path)}` +
    (qs ? `?${qs}` : '') +
    `#${encodeURIComponent(name)}`
  );
}

export function expandNodes(
  nodes: ParsedNode[],
  endpoints: Endpoint[],
  opts: ExpandOptions = {},
): { links: string[]; rows: PreviewRow[]; warnings: string[]; truncated: boolean } {
  const keep = opts.keepHostSni !== false;
  const max = opts.maxOutput ?? 200;
  const prefix = opts.prefix?.trim();
  const links: string[] = [];
  const rows: PreviewRow[] = [];
  const warnings: string[] = [];
  const used = new Set<string>();
  let truncated = false;

  if (!endpoints.length) warnings.push('没有可用的优选地址');

  const usable = nodes.filter((n) => {
    if (n.reality) {
      warnings.push(`REALITY 节点不能替换地址，已跳过：${n.name}`);
      return false;
    }
    return true;
  });

  outer: for (const node of usable) {
    // 原地址是域名才能拿来当 Host/SNI；IP 节点只能靠已有的 Host/SNI
    const origin = isIpLiteral(node.server) ? '' : node.server;
    if (!origin && !node.host && !node.sni) {
      warnings.push(`节点 ${node.name} 没有域名，也没有 Host/SNI，替换后握手可能失败`);
    }
    const host = node.host || (keep ? origin : '');
    const sni = node.sni || (keep ? origin : '');

    for (const ep of endpoints) {
      if (links.length >= max) {
        truncated = true;
        break outer;
      }
      const port = ep.port ?? node.port;
      const base = (prefix ? prefix + ' ' : '') + node.name + ' | ' + (ep.remark || ep.host);
      let name = base;
      for (let i = 2; used.has(name); i++) name = `${base} ${i}`;
      used.add(name);

      links.push(
        node.kind === 'vmess'
          ? buildVmess(node, ep, port, host, sni, name)
          : buildUrl(node, ep, port, host, sni, name),
      );
      if (rows.length < PREVIEW_ROWS) {
        rows.push({ name, kind: node.kind, server: ep.host, port, host, sni });
      }
    }
  }

  if (truncated) {
    const total = usable.length * endpoints.length;
    warnings.push(`组合共 ${total} 条，超过上限，只输出前 ${max} 条`);
  }
  return { links, rows, warnings, truncated };
}

/** SubConverter 的 url= 参数用 | 分隔多条链接 */
export function buildUrlParam(links: string[]): string {
  return links.join('|');
}
