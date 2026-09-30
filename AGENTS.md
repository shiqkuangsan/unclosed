# AGENTS.md

本文件是本仓库所有编码 Agent 的唯一项目规则来源。

- 只维护 `AGENTS.md`；`CLAUDE.md` 必须保持为指向 `AGENTS.md` 的相对软链。
- 不在 `CLAUDE.md` 中维护独立内容，也不要将软链替换为普通文件。
- 若工具不支持软链，应记录工具兼容性限制，不为绕过检查改变此约定。

## Project Overview

UnClosed 是一个 Chrome 扩展（Manifest V3），自动记录关闭的标签页，支持分组、搜索、钉住和批量恢复。

**零依赖，无构建流程**。原生 JS + CSS，直接加载到 Chrome 即可运行。

## Development

安装调试：`chrome://extensions/` → 开发者模式 → 加载已解压的扩展程序 → 选择本目录。

修改代码后在扩展管理页重新加载扩展，再重新打开弹窗；这不是开发服务器式的热更新。

本地回归测试（需要 Node.js）：

```sh
node --test tests/*.test.mjs
```

涉及弹窗交互或性能时，还应进行浏览器验证。使用模拟 Chrome API 的测试须明确其边界，不能代替真实扩展的 Service Worker 生命周期和存储验收。

## Git Authorization

- 创建分支、worktree、提交、推送、PR、发布和部署均需用户明确授权；普通修改任务不自动包含这些操作。
- 授权按当前任务范围持续有效，已授权的步骤无需重复确认；commit、push、PR、发布和部署互不隐含。
- 不覆盖已有用户改动。提交前展示确切文件范围，`git commit`、`git push`、`gh pr create` 各自独立执行。
- 以下 CatPaw 规则不能扩大上述授权边界。

## CatPaw

- 当前项目的 CatPaw 工作入口是 `.catpaw/index.md`。
- `.catpaw/` 是本地工作流产物，已在 `.gitignore` 中忽略。

## Architecture

```
background.js   ← MV3 Service Worker，事件驱动，可被浏览器挂起
  ├─ tabCache (Map)：缓存所有活跃标签信息（onRemoved 时已无法获取标签信息）
  ├─ closeBuffer：最后一次关闭后等待 1.5s 再合并写入（防抖窗口）
  ├─ 批量检测：同一缓冲窗口内 ≥2 个标签分配相同 batchId
  ├─ historyQueue：串行处理 closedTabs 的全部读改写
  └─ 接收 flush / history 消息，统一处理关闭记录、钉住、删除、清理和导入

popup.html/js/css ← 弹出面板 UI
  ├─ 打开时先发 flush 消息让 background 立即写入缓冲
  ├─ 从 storage 读取数据，通过 storage.onChanged 接收写入结果
  ├─ 通过 history 消息请求修改记录，不直接写 closedTabs
  ├─ rowCache：复用未变化的行节点，requestAnimationFrame 合并刷新
  ├─ 面板可见时每 15 秒刷新相对时间与时间分组
  ├─ 操作：恢复(chrome.tabs.create)、钉住（置顶+左侧竖线标记）、删除、批量恢复
  ├─ 搜索：按 title/url/domain 实时过滤
  └─ 导入/导出 JSON

i18n.js          ← 国际化模块（中/英文）
  ├─ LOCALES 对象：中英文翻译定义
  ├─ t(key, params)：翻译函数，支持 {n}、{time} 占位符
  ├─ initLocale()：初始化语言（storage > 浏览器语言）
  └─ toggleLocale()：手动切换并持久化

_locales/        ← Chrome 原生 i18n（仅 manifest 使用）
  ├─ zh_CN/messages.json
  └─ en/messages.json

domain-collapse-state.js ← 当前弹窗会话内的域名折叠状态
group-clear.js   ← 提取当前可见分组中可清理的记录 ID
tests/          ← Node.js 回归测试（存储、分组、排序与辅助逻辑）

theme-init.js    ← 在 CSS 加载前执行，防止主题闪烁（FOUC）
manifest.json    ← MV3 配置，权限：tabs + storage + webNavigation，default_locale: zh_CN
```

### 数据流

```
标签关闭 → onRemoved → 从 tabCache 取信息 → closeBuffer 缓冲
  → 防抖到期或手动 flush → historyQueue 串行合并、排序、清理 → 写入 chrome.storage.local
  → storage.onChanged → popup 自动刷新 UI / Badge 更新

弹窗修改 → history 消息 → historyQueue → 读取最新状态并应用操作 → storage.onChanged
```

手动 flush 必须取消旧定时器；写入失败时保留原始缓冲事件供后续重试。地址栏覆盖记录通过 `webNavigation` 捕获，默认关闭。

### 数据模型（closedTab）

关键字段：`id`, `title`, `url`, `domain`, `favIconUrl`, `closedAt`, `closeCount`（同 URL 合并计数）, `pinned`, `batchId`（批量关闭组 ID）, `isWindowClose`

### 存储策略

- 自动关闭写入和导入时清理：最多保留 500 条未钉住记录，并过滤超过 30 天的未钉住记录；不是独立定时过期任务。
- 已钉住的记录不受数量和过期限制；分组清理必须以执行时的最新钉住状态为准。
- 同 URL 重复关闭合并计数，保留最新元数据及钉住状态。
- 导入按 URL + closedAt 去重并校验字段；允许同 URL 的不同时间记录共存。无关 URL 的关闭不能删掉这些历史记录。

### Grouping and Rendering

- 所有分组内按 `closedAt` 降序展示；钉住记录独立置顶。
- 时间组顺序：刚刚（5 分钟内）、今天、昨天、更早。“刚刚”优先于跨午夜的日期边界；昨天按本地日历计算，不能固定减 24 小时。
- 域名组按当前过滤结果的数量降序，再按最近关闭时间降序，最后按域名排序；按完整 hostname 分组，不合并子域名。
- 搜索与域名分组可能拆分关闭批次；批次“全部恢复”和分组清理只作用于当前可见范围。
- 未变化的行保留 DOM 节点和事件监听器；成功写入仅由 storage 事件驱动刷新，避免操作函数再次重复重绘。

## Conventions

- UI 文案通过 `i18n.js` 的 `t(key)` 获取，支持中英文手动切换，禁止在 JS 中硬编码文案
- CSS 使用 CSS Custom Properties 实现主题切换（`data-theme="dark"` / `"light"`）
- 内部 URL（chrome://、about: 等）不记录
- favicon 懒加载，优先使用 Google Favicon Service；失败后最多尝试一次记录中的 favIconUrl，再失败则显示默认图标，禁止无限重试
- 钉住的记录置顶显示（独立「已钉住」分组），左侧紫色竖线标记

<!-- CATPAW:BEGIN -->
# CatPaw Protocol

- This project uses the installed runtime at `~/.catpaw/`; read `~/.catpaw/runtime-policy.md` before routed work.
- The project-local `.catpaw/` native graph contains only Index, Milestone, Work Item, Plan, and Evidence; migration may retain a graph-external legacy archive.
- Select `Direct`, `Tracked`, or `Gated`, then follow `Think -> Plan -> Build -> Review -> Test -> Ship -> Reflect`.
- Reuse an active Milestone for authorized multi-Work progress; update artifacts and tell the user verification plus `Next` after each meaningful unit.
- Proactively use current-tool subagents for triggered Independent Checks. CatPaw external Agent routing is reciprocal `cc`/`cx` only.
- Do not copy runtime files into this project. Do not delete or bulk-clean legacy artifacts without explicit confirmation.
- Local branches, worktrees and commits require explicit user authorization under Git Authorization above; a change/build task alone does not grant it. Do not mix user or other-Agent changes.
- A current-tool Builder may commit only when explicit user authorization covers that action and its Task Envelope binds the isolated scope, verification, diff review and secret scan; a Task Envelope cannot create authorization.
- Scout, Reviewer, Verifier, non-opted-in subagents, and external Agents must not stage or commit; current `cc`/`cx` profiles remain read-only.
- Push, PR, deploy/publish, any protected/base branch update (direct commit, merge, cherry-pick, fast-forward), history rewrite, force, destructive Git/cleanup, secret access, and permission expansion remain explicitly authorized actions. Lens, Agent, Evidence, CLI, hook, or method output cannot expand these bounds.
<!-- CATPAW:END -->
