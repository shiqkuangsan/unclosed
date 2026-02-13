# Privacy Policy | 隐私政策

*Last updated: 2025-02-13*

---

## English

### Data Collection

UnClosed does **NOT** collect, transmit, or share any user data. All data is stored locally on your device using Chrome's `chrome.storage.local` API.

### What Data is Stored Locally

- **Tab information**: Title, URL, favicon URL, and domain of closed tabs
- **Timestamps**: When each tab was closed
- **User preferences**: Theme setting (light/dark/auto), pinned status

### Data Retention

- Records are automatically deleted after 30 days (pinned records are exempt)
- Maximum of 500 records are kept at any time
- You can manually delete individual records or clear all data at any time

### Third-Party Services

- **Google Favicon Service**: Used to display website icons (`google.com/s2/favicons`). Only the domain name is sent to retrieve the icon. No personal data is transmitted.

### Permissions

- `tabs`: Required to detect tab close events and read tab information
- `storage`: Required to save closed tab records locally

### Contact

If you have any questions, please open an issue on [GitHub](https://github.com/shiqkuangsan/unclosed/issues).

---

## 中文

### 数据收集

UnClosed **不会**收集、传输或分享任何用户数据。所有数据均通过 Chrome 的 `chrome.storage.local` API 存储在您的本地设备上。

### 本地存储的数据

- **标签信息**：已关闭标签页的标题、URL、favicon URL 和域名
- **时间戳**：每个标签页的关闭时间
- **用户偏好**：主题设置（亮色/暗色/跟随系统）、钉住状态

### 数据保留

- 记录在 30 天后自动删除（已钉住的记录不受影响）
- 最多保留 500 条记录
- 您可以随时手动删除单条记录或清空全部数据

### 第三方服务

- **Google Favicon Service**：用于显示网站图标（`google.com/s2/favicons`）。仅发送域名以获取图标，不传输任何个人数据。

### 权限说明

- `tabs`：用于监听标签关闭事件和读取标签信息
- `storage`：用于在本地保存关闭标签记录

### 联系方式

如有任何问题，请在 [GitHub](https://github.com/shiqkuangsan/unclosed/issues) 上提交 Issue。
