<p align="center">
  <img src="icons/icon-128.png" width="80" height="80" alt="UnClosed Logo">
</p>

<h1 align="center">UnClosed</h1>

<p align="center">
  <em>You thought it was gone. It never left.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/manifest-v3-brightgreen.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/dependencies-zero-orange.svg" alt="Zero Dependencies">
</p>

<p align="center">
  <strong>English</strong> | <a href="#中文">中文</a>
</p>

<p align="center">
  <img src="assets/demo.gif" width="720" alt="UnClosed Demo">
</p>

## Features

- **Auto Capture** — Listens to all tab close events, records title, URL, favicon, and domain
- **Smart Grouping** — Group by time (Just now / Today / Yesterday / Earlier) or by domain
- **Batch Close Detection** — Tabs closed within a short window are grouped together with one-click restore
- **Search & Filter** — Real-time search by title, URL, or domain
- **Pin & Keep** — Pin important records to prevent auto-cleanup
- **Badge Count** — Icon badge shows today's closed tab count
- **Export / Import** — JSON format data export and import
- **Theme Switching** — Light / Dark / Follow System
- **Auto Cleanup** — Max 500 records, 30-day expiry (pinned records are exempt)

## Screenshots

| Light | Dark |
|:---:|:---:|
| <img src="assets/light-1.png" width="360"> | <img src="assets/dark-1.png" width="360"> |
| <img src="assets/light-2.png" width="360"> | <img src="assets/dark-2.png" width="360"> |

## Install

**Chrome Web Store** (under review)

<!-- TODO: Replace link after publishing -->
<!-- [<img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" height="58" alt="Chrome Web Store">](https://chrome.google.com/webstore/detail/unclosed/YOUR_EXTENSION_ID) -->

**Manual Install**

1. Download or clone this repository
2. Open Chrome, navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this directory

## Tech Stack

- Chrome Extension Manifest V3
- Service Worker for background monitoring
- chrome.storage.local for persistence
- Vanilla JS + CSS, zero dependencies

## Privacy

UnClosed does not collect or transmit any user data. All data is stored locally on your device. See [Privacy Policy](PRIVACY.md) for details.

## License

[MIT](LICENSE) © [shiqkuangsan](https://github.com/shiqkuangsan)

---

<h2 id="中文">中文</h2>

<p align="center">
  <a href="#unclosed">English</a> | <strong>中文</strong>
</p>

> 你以为它关了，其实它一直都在。

智能记录关闭的标签页，支持分组、搜索、钉住和批量恢复的 Chrome 扩展。

### 功能特性

- **自动捕获** — 监听所有标签关闭事件，自动记录标题、URL、favicon、域名
- **智能分组** — 按时间（刚刚 / 今天 / 昨天 / 更早）或按域名分组展示
- **批量关闭检测** — 短时间内关闭多个标签自动识别为一组，支持一键全部恢复
- **搜索过滤** — 按标题、URL、域名实时搜索
- **钉住收藏** — 重要记录可钉住，不会被自动清理
- **Badge 提示** — 图标角标显示今日关闭标签数量
- **导出 / 导入** — 支持 JSON 格式的数据导出和导入
- **主题切换** — 亮色 / 深色 / 跟随系统三种模式
- **自动清理** — 最多保留 500 条记录，30 天自动过期（已钉住的不受影响）

### 安装

**Chrome Web Store**（审核中）

<!-- TODO: 上架后替换链接 -->
<!-- [<img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" height="58" alt="Chrome Web Store">](https://chrome.google.com/webstore/detail/unclosed/YOUR_EXTENSION_ID) -->

**手动安装**

1. 下载或 clone 本仓库
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择本目录

### 技术实现

- Chrome Extension Manifest V3
- Service Worker 后台监听
- chrome.storage.local 持久化
- 原生 JS + CSS，零依赖
