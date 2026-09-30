/**
 * Tab Rescue - Background Service Worker
 *
 * 职责：
 * 1. 维护活跃标签页缓存（用于在 onRemoved 时获取已关闭标签的信息）
 * 2. 监听标签关闭事件，缓冲后写入 storage
 * 3. 批量关闭检测（短时间内关闭多个标签自动成组）
 * 4. Badge 角标更新
 */

// ============================================================
// 常量
// ============================================================
const BATCH_WINDOW_MS = 1500; // 批量关闭检测时间窗口
const MAX_RECORDS = 500;
const RETENTION_DAYS = 30;

// 不记录的内部 URL 前缀
const IGNORED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
  'devtools://',
];

// ============================================================
// 状态
// ============================================================
const tabCache = new Map(); // tabId -> { title, url, favIconUrl }
const navPending = new Map(); // tabId -> { title, url, favIconUrl, domain } (navigation override cache)
let closeBuffer = [];       // 待写入的关闭记录缓冲
let flushTimer = null;
let historyQueue = Promise.resolve();
let trackOverride = false;  // 是否记录地址栏覆盖的页面（默认关闭）

// ============================================================
// 初始化：查询所有已打开的标签页来填充缓存
// ============================================================
chrome.tabs.query({}).then(tabs => {
  for (const tab of tabs) {
    tabCache.set(tab.id, extractTabInfo(tab));
  }
});

// 读取设置
chrome.storage.local.get('settings').then(({ settings }) => {
  if (settings && typeof settings.trackOverride === 'boolean') {
    trackOverride = settings.trackOverride;
  }
});

// ============================================================
// 事件监听（必须在顶层同步注册）
// ============================================================

// 新标签创建 → 加入缓存
chrome.tabs.onCreated.addListener(tab => {
  tabCache.set(tab.id, extractTabInfo(tab));
});

// 标签更新 → 同步缓存
chrome.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
  tabCache.set(tabId, extractTabInfo(tab));
});

// 标签关闭 → 核心逻辑
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const tabInfo = tabCache.get(tabId);
  tabCache.delete(tabId);
  navPending.delete(tabId);

  // 无信息或内部页面，跳过
  if (!tabInfo || !tabInfo.url || isIgnoredUrl(tabInfo.url)) return;

  const closedTab = {
    id: generateId(),
    title: tabInfo.title,
    url: tabInfo.url,
    favIconUrl: tabInfo.favIconUrl,
    domain: getDomain(tabInfo.url),
    closedAt: Date.now(),
    closeCount: 1,
    pinned: false,
    isWindowClose: removeInfo.isWindowClosing,
  };

  bufferClose(closedTab);
});

// 导航覆盖检测：地址栏输入新 URL 覆盖当前页面
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId !== 0) return;
  const tabInfo = tabCache.get(details.tabId);
  if (tabInfo && tabInfo.url && !isIgnoredUrl(tabInfo.url)) {
    navPending.set(details.tabId, { ...tabInfo });
  }
});

chrome.webNavigation.onCommitted.addListener(details => {
  if (details.frameId !== 0) return;

  const pending = navPending.get(details.tabId);
  navPending.delete(details.tabId);

  if (!trackOverride || !pending) return;

  const { transitionType, transitionQualifiers = [] } = details;

  // 只捕获用户在地址栏主动输入的导航
  if (transitionType !== 'typed') return;
  if (!transitionQualifiers.includes('from_address_bar')) return;
  if (transitionQualifiers.includes('forward_back')) return;

  // URL 未变（刷新）则跳过
  if (pending.url === details.url) return;

  const closedTab = {
    id: generateId(),
    title: pending.title,
    url: pending.url,
    favIconUrl: pending.favIconUrl,
    domain: getDomain(pending.url),
    closedAt: Date.now(),
    closeCount: 1,
    pinned: false,
    isWindowClose: false,
  };

  bufferClose(closedTab);
});

// 存储变化 → 更新 Badge + 同步设置
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.closedTabs) {
    updateBadge(changes.closedTabs.newValue || []);
  }
  if (changes.settings) {
    const s = changes.settings.newValue || {};
    if (typeof s.trackOverride === 'boolean') {
      trackOverride = s.trackOverride;
    }
  }
});

// 启动时刷新 Badge
chrome.runtime.onInstalled.addListener(() => updateBadge());
chrome.runtime.onStartup.addListener(() => updateBadge());

// ============================================================
// 消息处理（popup 可能发送的指令）
// ============================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'flush' && message.type !== 'history') return;
  const operation = message.type === 'flush'
    ? flushBuffer().then(() => ({ ok: true }))
    : mutateHistory(message);
  operation.then(sendResponse, error => {
    console.error('History operation failed', error);
    sendResponse({ ok: false });
  });
  return true;
});

// A single writer serializes all history read/modify/write operations.
function enqueueHistory(operation) {
  const result = historyQueue.then(operation);
  historyQueue = result.catch(() => {});
  return result;
}

async function mutateHistory(message) {
  await flushBuffer();
  return enqueueHistory(async () => {
    const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');
    let tabs = closedTabs;
    let importedCount = 0;
    const ids = new Set(Array.isArray(message.ids) ? message.ids : []);
    switch (message.action) {
      case 'remove':
        tabs = tabs.filter(tab => !ids.has(tab.id));
        break;
      case 'clear':
        tabs = tabs.filter(tab => tab.pinned || !ids.has(tab.id));
        break;
      case 'toggle-pin':
        tabs = tabs.map(tab => tab.id === message.id ? { ...tab, pinned: !tab.pinned } : tab);
        break;
      case 'import': {
        if (!Array.isArray(message.tabs)) throw new Error('Invalid import');
        const keys = new Set(tabs.map(tab => `${tab.url}|${tab.closedAt}`));
        const additions = [];
        for (const raw of message.tabs) {
          const tab = normalizeImportedTab(raw);
          if (!tab) continue;
          const key = `${tab.url}|${tab.closedAt}`;
          if (keys.has(key)) continue;
          keys.add(key);
          additions.push(tab);
        }
        tabs = enforceLimit([...additions, ...tabs]);
        const retained = new Set(tabs.map(tab => tab.id));
        importedCount = additions.filter(tab => retained.has(tab.id)).length;
        break;
      }
      default:
        throw new Error('Unknown history action');
    }
    tabs.sort((a, b) => b.closedAt - a.closedAt);
    await chrome.storage.local.set({ closedTabs: tabs });
    return { ok: true, importedCount };
  });
}

function normalizeImportedTab(raw) {
  if (!raw || typeof raw.url !== 'string' || !Number.isFinite(raw.closedAt) || raw.closedAt <= 0) return null;
  let url;
  try { url = new URL(raw.url); } catch { return null; }
  if (!['http:', 'https:', 'file:', 'ftp:'].includes(url.protocol)) return null;
  return {
    id: generateId(),
    url: url.href,
    title: typeof raw.title === 'string' ? raw.title : url.href,
    domain: url.hostname,
    favIconUrl: typeof raw.favIconUrl === 'string' && /^https?:\/\//i.test(raw.favIconUrl) ? raw.favIconUrl : '',
    closedAt: Math.min(raw.closedAt, Date.now()),
    closeCount: Number.isSafeInteger(raw.closeCount) && raw.closeCount > 0 ? raw.closeCount : 1,
    pinned: raw.pinned === true,
    batchId: typeof raw.batchId === 'string' ? raw.batchId : null,
    isWindowClose: raw.isWindowClose === true,
  };
}

// ============================================================
// 核心函数
// ============================================================

/** 将关闭记录加入缓冲区（同一 URL 合并计数） */
function bufferClose(closedTab) {
  const existing = closeBuffer.find(t => t.url === closedTab.url);
  if (existing) {
    existing.closedAt = closedTab.closedAt;
    existing.closeCount = (existing.closeCount || 1) + 1;
  } else {
    closeBuffer.push(closedTab);
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushBuffer().catch(error => console.error('History flush failed', error)), BATCH_WINDOW_MS);

  // Badge 立即更新，不等待缓冲 flush
  updateBadgeWithBuffer();
}

/** 将 storage 已有数据 + 缓冲区数据合并计算 Badge */
async function updateBadgeWithBuffer() {
  const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');
  const all = [...closeBuffer, ...closedTabs];
  updateBadge(all);
}

/** 将缓冲区数据写入 storage */
function flushBuffer() {
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = null;
  return enqueueHistory(async () => {
    if (closeBuffer.length === 0) return;
    // Include events that arrived while waiting for the previous write.
    if (flushTimer !== null) clearTimeout(flushTimer);
    flushTimer = null;
    const batch = closeBuffer;
    closeBuffer = [];
    try {
      const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');
      const touched = new Set(batch.map(tab => tab.url));
      const untouched = [];
      const byUrl = new Map();
      for (const tab of closedTabs) {
        if (!touched.has(tab.url)) {
          untouched.push(tab);
          continue;
        }
        const existing = byUrl.get(tab.url);
        const latest = existing && existing.closedAt > tab.closedAt ? existing : tab;
        byUrl.set(tab.url, {
          ...latest,
          pinned: Boolean(tab.pinned || existing?.pinned),
          closeCount: (tab.closeCount || 1) + (existing ? existing.closeCount || 1 : 0),
        });
      }
      const batchId = batch.length >= 2 ? generateId() : null;
      for (const item of batch) {
        const existing = byUrl.get(item.url);
        const latest = existing && existing.closedAt > item.closedAt ? existing : item;
        byUrl.set(item.url, {
          ...latest,
          batchId,
          closeCount: (item.closeCount || 1) + (existing ? existing.closeCount || 1 : 0),
          pinned: Boolean(item.pinned || existing?.pinned),
        });
      }
      await chrome.storage.local.set({ closedTabs: enforceLimit([...byUrl.values(), ...untouched]) });
    } catch (error) {
      // Retain raw events (without merged persisted counts) for the next retry.
      closeBuffer = [...batch, ...closeBuffer];
      throw error;
    }
  });
}

/** Keep pinned records and at most MAX_RECORDS ordinary records. */
function enforceLimit(tabs) {
  const cutoff = Date.now() - RETENTION_DAYS * 86400000;
  let ordinaryCount = 0;
  return [...tabs].sort((a, b) => b.closedAt - a.closedAt).filter(tab =>
    tab.pinned || (tab.closedAt >= cutoff && ordinaryCount++ < MAX_RECORDS)
  );
}

/** 更新扩展图标 Badge */
async function updateBadge(closedTabs) {
  if (!closedTabs) {
    const data = await chrome.storage.local.get('closedTabs');
    closedTabs = data.closedTabs || [];
  }

  // 显示今日关闭数量
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const count = closedTabs.filter(t => t.closedAt >= todayStart.getTime()).length;

  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#818cf8' });
  chrome.action.setBadgeTextColor({ color: '#ffffff' });
}

// ============================================================
// 工具函数
// ============================================================

function extractTabInfo(tab) {
  return {
    title: tab.title || '(无标题)',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl || '',
  };
}

function isIgnoredUrl(url) {
  return IGNORED_PREFIXES.some(prefix => url.startsWith(prefix));
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
