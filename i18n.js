/**
 * UnClosed - i18n Module
 *
 * 支持中英文切换，默认跟随浏览器语言，用户可手动切换并持久化到 storage
 */

const LOCALES = {
  zh_CN: {
    // Header
    langLabel: '中',
    themeAuto: '主题: 跟随系统',
    themeDark: '主题: 深色',
    themeLight: '主题: 浅色',
    importTip: '导入记录',
    exportTip: '导出记录',
    clearTip: '清空全部',

    // Search
    searchPlaceholder: '搜索标题、网址或域名...',

    // View toggle
    byTime: '按时间',
    byDomain: '按域名',

    // Empty state
    noMatch: '没有找到匹配的标签页',
    noRecord: '暂无关闭记录',

    // Time groups
    justNow: '刚刚',
    today: '今天',
    yesterday: '昨天',
    earlier: '更早',

    // Pinned
    pinned: '已钉住',
    pinTip: '钉住',
    unpinTip: '取消钉住',

    // Tab actions
    restoreTip: '恢复标签页',
    deleteTip: '删除记录',

    // Batch
    windowClose: '窗口关闭',
    batchClose: '批量关闭',
    tabCount: '{n} 个标签',
    restoreAll: '全部恢复',

    // Domain
    unknownDomain: '(未知)',

    // Footer
    recordCount: '{n} 条记录',

    // Time format
    minutesAgo: '{n} 分钟前',
    yesterdayTime: '昨天 {time}',

    // Confirm dialog
    confirmClearWithPinned: '确定清空所有记录吗？（{n} 条已钉住的记录会保留）',
    confirmClear: '确定清空所有关闭记录吗？',
    cancel: '取消',
    confirm: '确定',

    // Import/Export
    importFormatError: '文件格式不正确',
    importSuccess: '成功导入 {n} 条记录',
    importParseError: '导入失败：文件解析错误',
  },

  en: {
    // Header
    langLabel: 'EN',
    themeAuto: 'Theme: System',
    themeDark: 'Theme: Dark',
    themeLight: 'Theme: Light',
    importTip: 'Import',
    exportTip: 'Export',
    clearTip: 'Clear All',

    // Search
    searchPlaceholder: 'Search title, URL or domain...',

    // View toggle
    byTime: 'By Time',
    byDomain: 'By Domain',

    // Empty state
    noMatch: 'No matching tabs found',
    noRecord: 'No closed tabs yet',

    // Time groups
    justNow: 'Just Now',
    today: 'Today',
    yesterday: 'Yesterday',
    earlier: 'Earlier',

    // Pinned
    pinned: 'Pinned',
    pinTip: 'Pin',
    unpinTip: 'Unpin',

    // Tab actions
    restoreTip: 'Restore tab',
    deleteTip: 'Delete record',

    // Batch
    windowClose: 'Window closed',
    batchClose: 'Batch closed',
    tabCount: '{n} tabs',
    restoreAll: 'Restore All',

    // Domain
    unknownDomain: '(Unknown)',

    // Footer
    recordCount: '{n} records',

    // Time format
    minutesAgo: '{n} min ago',
    yesterdayTime: 'Yesterday {time}',

    // Confirm dialog
    confirmClearWithPinned: 'Clear all records? ({n} pinned records will be kept)',
    confirmClear: 'Clear all closed tab records?',
    cancel: 'Cancel',
    confirm: 'OK',

    // Import/Export
    importFormatError: 'Invalid file format',
    importSuccess: 'Successfully imported {n} records',
    importParseError: 'Import failed: file parse error',
  },
};

let currentLocale = 'zh_CN';

/**
 * 初始化语言：优先读 storage，否则根据浏览器语言判断
 */
async function initLocale() {
  const { locale } = await chrome.storage.local.get('locale');
  if (locale && LOCALES[locale]) {
    currentLocale = locale;
  } else {
    const browserLang = chrome.i18n.getUILanguage();
    currentLocale = browserLang.startsWith('zh') ? 'zh_CN' : 'en';
  }
}

/**
 * 获取翻译文案，支持 {n}、{time} 等占位符替换
 */
function t(key, params) {
  let msg = LOCALES[currentLocale]?.[key] || LOCALES.zh_CN[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(`{${k}}`, v);
    }
  }
  return msg;
}

/**
 * 切换语言并持久化
 */
async function toggleLocale() {
  currentLocale = currentLocale === 'zh_CN' ? 'en' : 'zh_CN';
  await chrome.storage.local.set({ locale: currentLocale });
}
