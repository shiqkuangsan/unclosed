/**
 * UnClosed - Popup Script
 *
 * 职责：展示关闭标签列表、搜索过滤、分组视图、钉住/恢复/删除操作
 */

// ============================================================
// SVG 图标
// ============================================================
const ICONS = {
  globe: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
    <circle cx="8" cy="8" r="6.5"/><path d="M1.5 8h13M8 1.5c-2 2.5-2 9.5 0 13M8 1.5c2 2.5 2 9.5 0 13"/>
  </svg>`,
  pin: `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
    <path d="M4.146 13.854a.5.5 0 0 1 0-.708L6.5 10.793l-2.45-2.45a.5.5 0 0 1 .108-.79l3.5-2a.5.5 0 0 1 .56.06L10.5 7.5l2.646-2.646a.5.5 0 0 1 .708.708L11.207 8.207l1.887 1.887a.5.5 0 0 1 .06.56l-2 3.5a.5.5 0 0 1-.79.108L7.914 11.81l-3.06 3.06a.5.5 0 0 1-.708 0z"/>
  </svg>`,
  pinOutline: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" width="14" height="14">
    <path d="M4.146 13.854 6.5 10.793l-2.45-2.45 3.5-2 .56.06L10.5 7.5l2.646-2.646.708.708-2.647 2.645 1.887 1.887-.06.56-2 3.5-.79.108L7.914 11.81l-3.06 3.06z"/>
  </svg>`,
  restore: `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
    <path d="M3.5 6.5A5 5 0 0 1 8 3a5 5 0 0 1 5 5 5 5 0 0 1-5 5 .5.5 0 0 1 0-1A4 4 0 0 0 12 8 4 4 0 0 0 8 4a4 4 0 0 0-3.6 2.25H6a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 1 0v2.5z"/>
  </svg>`,
  delete: `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>`,
  empty: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
    <rect x="12" y="8" width="40" height="48" rx="4"/><path d="M20 20h24M20 28h24M20 36h12" stroke-linecap="round"/>
  </svg>`,
  window: `<svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12V4zM4 3.5a.5.5 0 0 0-.5.5v1h9V4a.5.5 0 0 0-.5-.5H4z"/>
  </svg>`,
  themeAuto: `<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
    <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5v-7zM3.5 3a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-9zM6 13a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1z"/>
  </svg>`,
  themeDark: `<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
    <path d="M14.53 10.53a7 7 0 01-9.058-9.058A7.003 7.003 0 008 15a7.002 7.002 0 006.53-4.47z"/>
  </svg>`,
  themeLight: `<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
    <path d="M8 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 1zm0 10a3 3 0 100-6 3 3 0 000 6zm5.657-8.157a.75.75 0 010 1.06l-1.061 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-9.193 9.193a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM15 8a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0115 8zM4.25 8a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 014.25 8zm9.407 5.657a.75.75 0 01-1.06 0l-1.06-1.061a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 010 1.06zM4.464 4.465a.75.75 0 01-1.06 0l-1.06-1.06a.75.75 0 011.06-1.061l1.06 1.06a.75.75 0 010 1.06zM8 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 13z"/>
  </svg>`,
};

// ============================================================
// 状态
// ============================================================
let allTabs = [];
let filteredTabs = [];
let searchQuery = '';
let groupBy = 'time'; // 'time' | 'domain'
let themeMode = 'auto'; // 'auto' | 'light' | 'dark'

// ============================================================
// DOM 引用
// ============================================================
const $tabList = document.getElementById('tab-list');
const $searchInput = document.getElementById('search-input');
const $tabCount = document.getElementById('tab-count');
const $toggleBtns = document.querySelectorAll('.toggle-btn');

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await initLocale();
  await initTheme();
  updateUITexts();

  // 请求 background 立即刷新缓冲
  try {
    await chrome.runtime.sendMessage({ type: 'flush' });
  } catch { /* background 可能未就绪 */ }

  await loadTabs();
  render();
  setupListeners();
});

// ============================================================
// 更新静态 UI 文案
// ============================================================
function updateUITexts() {
  // 搜索框
  $searchInput.placeholder = t('searchPlaceholder');

  // 视图切换按钮
  $toggleBtns.forEach(btn => {
    btn.textContent = btn.dataset.group === 'time' ? t('byTime') : t('byDomain');
  });

  // Header 按钮 title
  document.getElementById('btn-lang').textContent = t('langLabel');
  document.getElementById('btn-import').title = t('importTip');
  document.getElementById('btn-export').title = t('exportTip');
  document.getElementById('btn-clear').title = t('clearTip');

  // 主题按钮 title
  updateThemeIcon();
}

// ============================================================
// 数据加载
// ============================================================
async function loadTabs() {
  const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');
  allTabs = closedTabs;
  applyFilter();
}

function applyFilter() {
  if (!searchQuery) {
    filteredTabs = allTabs;
  } else {
    const q = searchQuery.toLowerCase();
    filteredTabs = allTabs.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.url.toLowerCase().includes(q) ||
      t.domain.toLowerCase().includes(q)
    );
  }
}

// ============================================================
// 渲染
// ============================================================
function render() {
  $tabList.innerHTML = '';
  $tabCount.textContent = t('recordCount', { n: allTabs.length });

  if (filteredTabs.length === 0) {
    $tabList.innerHTML = `
      <div class="empty-state">
        ${ICONS.empty}
        <span>${searchQuery ? t('noMatch') : t('noRecord')}</span>
      </div>`;
    return;
  }

  // 钉住的记录置顶显示
  const pinnedTabs = filteredTabs.filter(t => t.pinned);
  const unpinnedTabs = filteredTabs.filter(t => !t.pinned);

  if (pinnedTabs.length > 0) {
    renderGroup(t('pinned'), pinnedTabs);
  }

  if (unpinnedTabs.length > 0) {
    if (groupBy === 'time') {
      renderByTime(unpinnedTabs);
    } else {
      renderByDomain(unpinnedTabs);
    }
  }
}

// ---- 按时间分组 ----
function renderByTime(tabs) {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart.getTime() - 86400000;
  const fiveMin = 5 * 60 * 1000;

  const groups = [
    { label: t('justNow'), tabs: [] },
    { label: t('today'), tabs: [] },
    { label: t('yesterday'), tabs: [] },
    { label: t('earlier'), tabs: [] },
  ];

  for (const tab of tabs) {
    if (now - tab.closedAt < fiveMin) {
      groups[0].tabs.push(tab);
    } else if (tab.closedAt >= todayStart.getTime()) {
      groups[1].tabs.push(tab);
    } else if (tab.closedAt >= yesterdayStart) {
      groups[2].tabs.push(tab);
    } else {
      groups[3].tabs.push(tab);
    }
  }

  for (const group of groups) {
    if (group.tabs.length === 0) continue;
    renderGroup(group.label, group.tabs);
  }
}

// ---- 按域名分组 ----
function renderByDomain(tabs) {
  const domainMap = new Map();
  for (const tab of tabs) {
    const domain = tab.domain || t('unknownDomain');
    if (!domainMap.has(domain)) domainMap.set(domain, []);
    domainMap.get(domain).push(tab);
  }

  // 按标签数量降序排列
  const sorted = [...domainMap.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [domain, tabs] of sorted) {
    renderGroup(domain, tabs);
  }
}

// ---- 渲染一个分组 ----
function renderGroup(label, tabs) {
  // 分组头
  const $header = document.createElement('div');
  $header.className = 'group-header';
  $header.innerHTML = `<span>${label}</span><span class="count">${tabs.length}</span>`;
  $tabList.appendChild($header);

  // 检测批量关闭
  const batches = detectBatches(tabs);

  for (const batch of batches) {
    if (batch.length >= 2 && batch[0].batchId) {
      // 批量关闭组
      renderBatchGroup(batch);
    } else {
      // 单个标签
      for (const tab of batch) {
        $tabList.appendChild(createTabItem(tab, false));
      }
    }
  }
}

// ---- 检测批量关闭 ----
function detectBatches(tabs) {
  if (tabs.length === 0) return [];

  const batches = [];
  let currentBatch = [tabs[0]];

  for (let i = 1; i < tabs.length; i++) {
    const tab = tabs[i];
    const prevTab = currentBatch[currentBatch.length - 1];

    if (tab.batchId && tab.batchId === prevTab.batchId) {
      currentBatch.push(tab);
    } else {
      batches.push(currentBatch);
      currentBatch = [tab];
    }
  }
  batches.push(currentBatch);

  return batches;
}

// ---- 渲染批量关闭组 ----
function renderBatchGroup(batch) {
  const isWindowClose = batch.some(t => t.isWindowClose);
  const tabCountText = t('tabCount', { n: batch.length });
  const label = isWindowClose
    ? `${ICONS.window} ${t('windowClose')} (${tabCountText})`
    : `${t('batchClose')} (${tabCountText})`;

  const $header = document.createElement('div');
  $header.className = 'batch-header';
  $header.innerHTML = `
    <span>${label}</span>
    <button class="batch-restore-btn">${t('restoreAll')}</button>
  `;
  $header.querySelector('.batch-restore-btn').addEventListener('click', () => {
    restoreBatch(batch);
  });
  $tabList.appendChild($header);

  for (const tab of batch) {
    $tabList.appendChild(createTabItem(tab, true));
  }
}

// ---- 创建单个标签项 ----
function createTabItem(tab, isBatchChild) {
  const $item = document.createElement('div');
  $item.className = `tab-item${isBatchChild ? ' batch-child' : ''}${tab.pinned ? ' pinned' : ''}`;
  $item.dataset.id = tab.id;

  const pinIcon = tab.pinned ? ICONS.pin : ICONS.pinOutline;
  const pinClass = tab.pinned ? ' pinned' : '';

  $item.innerHTML = `
    <span class="tab-favicon-fallback">${ICONS.globe}</span>
    <div class="tab-info">
      <span class="tab-title" title="${escapeHtml(tab.url)}">${escapeHtml(tab.title)}</span>
      <div class="tab-meta">
        <span class="tab-domain">${escapeHtml(tab.domain)}</span>
        ${(tab.closeCount || 1) > 1 ? `<span class="tab-count">&times;${tab.closeCount}</span>` : ''}
        <span class="tab-time">${formatTime(tab.closedAt)}</span>
      </div>
    </div>
    <div class="tab-actions">
      <button class="tab-action-btn tab-action-btn--pin${pinClass}" title="${tab.pinned ? t('unpinTip') : t('pinTip')}">
        ${pinIcon}
      </button>
      <button class="tab-action-btn tab-action-btn--restore" title="${t('restoreTip')}">
        ${ICONS.restore}
      </button>
      <button class="tab-action-btn tab-action-btn--delete" title="${t('deleteTip')}">
        ${ICONS.delete}
      </button>
    </div>
  `;

  // favicon：优先用 Google Favicon Service（主题无关），失败时回退到原始 URL
  if (tab.domain) {
    const $fallback = $item.querySelector('.tab-favicon-fallback');
    const img = new Image();
    img.className = 'tab-favicon';
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tab.domain)}&sz=32`;
    img.addEventListener('load', () => $fallback.replaceWith(img));
    img.addEventListener('error', () => {
      if (tab.favIconUrl) {
        img.src = tab.favIconUrl;
        img.onerror = null;
      }
    });
  }

  // 事件绑定
  $item.querySelector('.tab-title').addEventListener('click', () => restoreTab(tab));
  $item.querySelector('.tab-action-btn--pin').addEventListener('click', () => togglePin(tab.id));
  $item.querySelector('.tab-action-btn--restore').addEventListener('click', () => restoreTab(tab));
  $item.querySelector('.tab-action-btn--delete').addEventListener('click', () => deleteTab(tab.id));

  return $item;
}

// ============================================================
// 操作函数
// ============================================================

/** 恢复单个标签页 */
async function restoreTab(tab) {
  await chrome.tabs.create({ url: tab.url, active: true });
  await deleteTab(tab.id);
}

/** 恢复一批标签页 */
async function restoreBatch(batch) {
  for (const tab of batch) {
    await chrome.tabs.create({ url: tab.url, active: false });
  }
  // 批量删除
  const ids = new Set(batch.map(t => t.id));
  allTabs = allTabs.filter(t => !ids.has(t.id));
  await saveTabs();
  applyFilter();
  render();
}

/** 切换钉住状态 */
async function togglePin(tabId) {
  const tab = allTabs.find(t => t.id === tabId);
  if (!tab) return;
  tab.pinned = !tab.pinned;
  await saveTabs();
  applyFilter();
  render();
}

/** 删除单条记录 */
async function deleteTab(tabId) {
  allTabs = allTabs.filter(t => t.id !== tabId);
  await saveTabs();
  applyFilter();
  render();
}

/** 清空全部（保留钉住的） */
async function clearAll() {
  const pinnedCount = allTabs.filter(t => t.pinned).length;
  const msg = pinnedCount > 0
    ? t('confirmClearWithPinned', { n: pinnedCount })
    : t('confirmClear');

  showConfirm(msg, async () => {
    allTabs = allTabs.filter(t => t.pinned);
    await saveTabs();
    applyFilter();
    render();
  });
}

/** 导出为 JSON */
function exportData() {
  const data = JSON.stringify(allTabs, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unclosed-${formatDate(Date.now())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导入 JSON */
function importData() {
  document.getElementById('import-file').click();
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (!Array.isArray(imported)) {
      alert(t('importFormatError'));
      return;
    }

    // 合并：按 URL+closedAt 去重
    const existingKeys = new Set(allTabs.map(t => `${t.url}|${t.closedAt}`));
    const newTabs = imported.filter(t =>
      t.url && t.closedAt && !existingKeys.has(`${t.url}|${t.closedAt}`)
    );

    allTabs = [...newTabs, ...allTabs].sort((a, b) => b.closedAt - a.closedAt);
    await saveTabs();
    applyFilter();
    render();

    alert(t('importSuccess', { n: newTabs.length }));
  } catch {
    alert(t('importParseError'));
  }

  // 重置 input
  event.target.value = '';
}

// ============================================================
// 存储
// ============================================================
async function saveTabs() {
  await chrome.storage.local.set({ closedTabs: allTabs });
}

// ============================================================
// 事件监听
// ============================================================
function setupListeners() {
  // 搜索
  $searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    applyFilter();
    render();
  });

  // 视图切换
  $toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      $toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      groupBy = btn.dataset.group;
      render();
    });
  });

  // 头部按钮
  document.getElementById('btn-lang').addEventListener('click', async () => {
    await toggleLocale();
    updateUITexts();
    render();
  });
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('author-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/shiqkuangsan' });
  });
  document.getElementById('btn-clear').addEventListener('click', clearAll);
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', importData);
  document.getElementById('import-file').addEventListener('change', handleImport);

  // 监听 storage 变化（background 可能写入新数据）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.closedTabs) {
      allTabs = changes.closedTabs.newValue || [];
      applyFilter();
      render();
    }
  });
}

// ============================================================
// 确认弹窗
// ============================================================
function showConfirm(message, onConfirm) {
  const $overlay = document.createElement('div');
  $overlay.className = 'confirm-overlay';
  $overlay.innerHTML = `
    <div class="confirm-dialog">
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="confirm-btn" id="confirm-cancel">${t('cancel')}</button>
        <button class="confirm-btn confirm-btn--danger" id="confirm-ok">${t('confirm')}</button>
      </div>
    </div>`;

  document.body.appendChild($overlay);

  $overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
    $overlay.remove();
  });
  $overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    $overlay.remove();
    onConfirm();
  });
  $overlay.addEventListener('click', (e) => {
    if (e.target === $overlay) $overlay.remove();
  });
}

// ============================================================
// 工具函数
// ============================================================

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);

  if (diff < 60000) return t('justNow');
  if (diff < 3600000) return t('minutesAgo', { n: Math.floor(diff / 60000) });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (timestamp >= today.getTime()) {
    return timeStr;
  }

  const yesterday = today.getTime() - 86400000;
  if (timestamp >= yesterday) {
    return t('yesterdayTime', { time: timeStr });
  }

  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${timeStr}`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// 主题管理
// ============================================================

async function initTheme() {
  const { theme = 'auto' } = await chrome.storage.local.get('theme');
  themeMode = theme;
  applyTheme();

  // 系统主题变化时，auto 模式自动跟随
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeMode === 'auto') applyTheme();
  });
}

function applyTheme() {
  const isDark = themeMode === 'dark' ||
    (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('unclosed-theme', themeMode);
  updateThemeIcon();
}

function toggleTheme() {
  const modes = ['auto', 'dark', 'light'];
  themeMode = modes[(modes.indexOf(themeMode) + 1) % 3];
  chrome.storage.local.set({ theme: themeMode });
  applyTheme();
}

function updateThemeIcon() {
  const $btn = document.getElementById('btn-theme');
  if (!$btn) return;
  const icons = { auto: ICONS.themeAuto, dark: ICONS.themeDark, light: ICONS.themeLight };
  const titles = { auto: t('themeAuto'), dark: t('themeDark'), light: t('themeLight') };
  $btn.innerHTML = icons[themeMode];
  $btn.title = titles[themeMode];
}
