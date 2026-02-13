# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UnClosed 是一个 Chrome 扩展（Manifest V3），自动记录关闭的标签页，支持分组、搜索、钉住和批量恢复。

**零依赖，无构建流程**。原生 JS + CSS，直接加载到 Chrome 即可运行。

## Development

安装调试：`chrome://extensions/` → 开发者模式 → 加载已解压的扩展程序 → 选择本目录。

修改代码后在扩展管理页点击刷新图标即可热更新（修改 background.js 需要重新加载扩展）。

## Architecture

```
background.js   ← Service Worker，后台常驻
  ├─ tabCache (Map)：缓存所有活跃标签信息（onRemoved 时已无法获取标签信息）
  ├─ closeBuffer：关闭事件缓冲区，1.5s 窗口内合并写入
  ├─ 批量检测：同一缓冲窗口内 ≥2 个标签分配相同 batchId
  └─ 写入 chrome.storage.local（key: closedTabs）

popup.html/js/css ← 弹出面板 UI
  ├─ 打开时先发 flush 消息让 background 立即写入缓冲
  ├─ 从 storage 读取数据，支持按时间/域名分组渲染
  ├─ 操作：恢复(chrome.tabs.create)、钉住、删除、批量恢复
  ├─ 搜索：按 title/url/domain 实时过滤
  └─ 导入/导出 JSON

theme-init.js    ← 在 CSS 加载前执行，防止主题闪烁（FOUC）
manifest.json    ← MV3 配置，权限：tabs + storage
```

### 数据流

```
标签关闭 → onRemoved → 从 tabCache 取信息 → closeBuffer 缓冲
  → 1.5s 后 flushBuffer → 合并去重 → 写入 chrome.storage.local
  → storage.onChanged → popup 自动刷新 UI / Badge 更新
```

### 数据模型（closedTab）

关键字段：`id`, `title`, `url`, `domain`, `favIconUrl`, `closedAt`, `closeCount`（同 URL 合并计数）, `pinned`, `batchId`（批量关闭组 ID）, `isWindowClose`

### 存储策略

- 最多 500 条记录，30 天自动过期
- 已钉住的记录不受清理影响
- 同 URL 重复关闭会合并计数而非创建新记录

## Conventions

- 所有 UI 文本使用中文
- CSS 使用 CSS Custom Properties 实现主题切换（`data-theme="dark"` / `"light"`）
- 内部 URL（chrome://、about: 等）不记录
- favicon 优先使用 Google Favicon Service，失败后回退到 Chrome 缓存的 favIconUrl
