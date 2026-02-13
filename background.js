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
let closeBuffer = [];       // 待写入的关闭记录缓冲
let flushTimer = null;

// ============================================================
// 初始化：查询所有已打开的标签页来填充缓存
// ============================================================
chrome.tabs.query({}).then(tabs => {
  for (const tab of tabs) {
    tabCache.set(tab.id, extractTabInfo(tab));
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

// 存储变化 → 更新 Badge
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.closedTabs) {
    updateBadge(changes.closedTabs.newValue || []);
  }
});

// 启动时刷新 Badge
chrome.runtime.onInstalled.addListener(() => updateBadge());
chrome.runtime.onStartup.addListener(() => updateBadge());

// ============================================================
// 消息处理（popup 可能发送的指令）
// ============================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'flush') {
    // popup 打开时请求立即刷新缓冲
    flushBuffer().then(() => sendResponse({ ok: true }));
    return true; // 异步响应
  }
});

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
  flushTimer = setTimeout(flushBuffer, BATCH_WINDOW_MS);

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
async function flushBuffer() {
  if (closeBuffer.length === 0) return;

  const batch = closeBuffer;
  closeBuffer = [];
  flushTimer = null;

  // 如果 2 个以上标签在同一批次关闭，分配相同 batchId
  if (batch.length >= 2) {
    const batchId = generateId();
    batch.forEach(tab => (tab.batchId = batchId));
  } else {
    batch[0].batchId = null;
  }

  // 读取现有数据
  const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');

  // 去重：如果 storage 中已有相同 URL 的记录，合并计数
  for (const bufItem of batch) {
    const existingIdx = closedTabs.findIndex(t => t.url === bufItem.url);
    if (existingIdx !== -1) {
      const existing = closedTabs[existingIdx];
      bufItem.closeCount = (bufItem.closeCount || 1) + (existing.closeCount || 1);
      if (existing.pinned) bufItem.pinned = true;
      closedTabs.splice(existingIdx, 1);
    }
  }

  const merged = [...batch.reverse(), ...closedTabs]; // 最新的在前
  const cleaned = enforceLimit(merged);
  await chrome.storage.local.set({ closedTabs: cleaned });
}

/** 清理超限和过期记录 */
function enforceLimit(tabs) {
  const cutoff = Date.now() - RETENTION_DAYS * 86400000;
  return tabs
    .filter(tab => tab.pinned || tab.closedAt >= cutoff)
    .slice(0, MAX_RECORDS);
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
