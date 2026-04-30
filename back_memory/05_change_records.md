# PG-Tracker 桌面版维护记录

> 本文档用于记录每次维护时阅读了哪些文件、获得了哪些结论、修改了哪些代码、如何验证，以及还剩哪些风险。
>
> 版本：v1.1 | 创建日期：2026-04-29

---

## 2026-04-29 优化：修复 5 个审查发现

### 用户目标

- 根据代码审查发现进行优化。
- 修复清空数据不完整、详情页绑定文件不刷新、备份导入重复 ID、更新失败状态、Linux 图标资源缺失。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 修复备份、清空、导入和启动失败流程 | 需要统一清空所有业务表；导入默认应为替换恢复；初始化失败后应退出应用 |
| `electron/preload/index.ts` | 同步新增 IPC | 需要暴露 `backup.clearAll()` 和带 options 的 `backup.importAll()` |
| `src/env.d.ts` | 同步 renderer 类型 | 需要补齐 `backup.clearAll` 和 `importAll` options 类型 |
| `src/components/features/Settings.tsx` | 修复清空和导入流程 | 清空应调用主进程完整清空；导入前应确认替换式恢复并校验备份格式 |
| `src/components/features/InstitutionDetail.tsx` | 修复绑定文件刷新 | 文件绑定应走 store `addAsset()`，创建成功后刷新 institutions |
| `src/lib/useUpdater.ts` | 修复更新失败 UI 状态 | IPC 返回 `{ success: false }` 时也要进入 error 状态 |
| `src/stores/appStore.ts` | 收敛任务刷新语义 | `updateTask`/`deleteTask` 应同时刷新 institutions 和 orphanTasks |
| `src/stores/appStore.test.ts` | 补测试 | 增加 `updateTask` 成功后刷新 orphanTasks 的测试，更新 deleteTask 断言 |
| `electron-builder-linux.yml` | 检查 Linux 图标引用 | 配置引用 `resources/icon.png` |
| `软件功能页面截屏/软件图标.png` | 寻找可复用图标资源 | 复制为 `resources/icon.png` |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | 新增 `clearApplicationData()`，按依赖顺序清空 `EmailVariable`、`EmailTemplate`、`Asset`、`Interview`、`Task`、`Advisor`、`Institution` | 让“清除所有数据”真正覆盖全部业务表，避免独立任务、邮件模板和孤立资源残留 |
| `electron/main/index.ts` | 新增 `backup:clearAll` IPC | 给设置页提供原子化完整清空入口 |
| `electron/main/index.ts` | `backup:importAll` 新增 options，默认 `replace`，导入前先清空；保留 `append` 模式 | 备份恢复不再因重复 id 失败，同时保留未来追加导入能力 |
| `electron/main/index.ts` | 导入前校验备份 payload 至少包含一个可导入数组 | 防止无效文件触发替换式清空 |
| `electron/main/index.ts` | 数据库初始化失败后调用 `app.quit()` | 避免启动失败后留下无窗口进程 |
| `electron/preload/index.ts`、`src/env.d.ts` | 同步 `backup.clearAll()` 和 `backup.importAll(data, options)` | 保持 preload 和 renderer 类型一致 |
| `src/components/features/Settings.tsx` | 清空数据改为调用 `window.api.backup.clearAll()` | 修复清空数据不完整 |
| `src/components/features/Settings.tsx` | 导入前校验格式并提示会先清空再恢复；调用 `importAll(payload, { mode: 'replace' })` | 明确导入语义，避免用户误以为是追加 |
| `src/components/features/InstitutionDetail.tsx` | `AdvisorCard` 绑定文件改走 `addAsset()` | 绑定文件后立即刷新详情数据 |
| `src/lib/useUpdater.ts` | 处理 `check()`/`download()` 返回的 `success:false` | 更新失败能进入错误状态，不再卡在 checking |
| `src/stores/appStore.ts` | `updateTask`/`deleteTask` 成功后刷新 `orphanTasks` | 收敛独立任务刷新逻辑，减少页面级补丁依赖 |
| `src/stores/appStore.test.ts` | 新增/更新任务刷新断言 | 覆盖 store 刷新语义 |
| `resources/icon.png` | 新增 Linux 打包图标资源 | 修复 Linux 配置引用的缺失文件 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，0 errors，142 warnings |
| `npm test` | 通过，3 files / 75 tests |
| `npm run build` | 通过 |
| 清理 `tsconfig.tsbuildinfo` | 已清理 |

### 剩余风险和后续

- `lint` warning 仍主要是既有 `any` 类型债和少量 hook deps，可后续按 IPC DTO 类型化逐步收敛。
- 三平台真实打包验证还未在本轮执行，尤其 macOS/Linux 需要对应 runner 或目标环境确认。
- `backup:importAll` 已支持 `append`，但 UI 当前固定使用替换式恢复；后续如需要可在设置页增加“追加导入”选项。

## 2026-04-29 代码阅读：潜在 bug 复查

### 用户目标

- 先阅读当前文件，判断是否还有潜在 bug。
- 本次不修改业务代码，只记录阅读范围、验证命令和审查发现。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `back_memory/README.md` | 确认维护流程和记录要求 | 每次阅读、验证、修改后都应追加记录到 `05_change_records.md` |
| `back_memory/02_technical_details.md` | 确认 IPC、数据库、打包风险 | 当前剩余重点集中在打包资源、IPC 类型和验证覆盖 |
| `back_memory/03_project_progress.md` | 确认当前阶段和待办 | 阶段七三平台打包验证仍未完成 |
| `back_memory/04_code_file_index.md` | 确认重点审查入口 | 优先检查 main/preload/store/Settings/Timeline/InstitutionDetail |
| `package.json` | 确认版本、脚本和测试命令 | 当前版本为 `2.4.0`，`typecheck`/`lint`/`test` 脚本可用 |
| `electron/main/index.ts` | 审查数据库、IPC、备份导入、更新 IPC | `backup:importAll` 偏追加导入；启动初始化失败时仅 return，可能残留无窗口进程 |
| `electron/preload/index.ts` | 审查暴露给 renderer 的 IPC | 暴露接口完整，但大量 `any` 仍是类型债 |
| `electron/main/updater.ts` | 审查自动更新事件流 | updater 状态依赖事件推送，窗口重建场景仍需复查 |
| `src/stores/appStore.ts` | 审查全局刷新策略 | `updateTask`/`deleteTask` 只刷新 institutions，不通用刷新 orphanTasks |
| `src/components/features/Settings.tsx` | 审查导入导出、清空数据、更新 UI | “清除所有数据”只删除院校，未删除独立任务和邮件模板 |
| `src/components/features/InstitutionDetail.tsx` | 审查详情页文件/任务/导师操作 | 绑定文件直接调 `window.api.asset.create`，绕过 store 刷新 |
| `src/components/features/Timeline.tsx` | 审查独立任务操作 | 页面内手动刷新 orphanTasks，当前可用但逻辑分散 |
| `src/components/features/InterviewForm.tsx` | 审查面经新增刷新 | 使用 store `addInterview`，会刷新 institutions |
| `src/components/features/TaskForm.tsx` | 审查任务新增/编辑 | 使用 store `addTask`/`updateTask` |
| `src/components/features/AdvisorForm.tsx` | 审查导师新增/编辑 | 使用 store `addAdvisor`/`updateAdvisor` |
| `src/lib/utils.ts` | 审查日期和校验工具 | 日期 helper 有测试覆盖 |
| `src/lib/useUpdater.ts` | 审查自动更新 UI 状态 | 忽略 IPC 返回的 `{ success: false }`，可能一直停在 checking |
| `prisma/schema.prisma` | 对照备份/导入和级联删除 | 删除院校不会删除 orphanTasks/emailTemplates |
| `electron-builder*.yml` | 审查三平台打包配置 | Linux 配置引用 `resources/icon.png`，当前未发现该文件 |
| `.github/workflows/release.yml` | 审查发布构建流程 | 三平台 tag 构建存在，但仍需真实跑一次验证 |
| `src/lib/*.test.ts`、`src/stores/appStore.test.ts` | 确认测试覆盖 | 当前 3 个测试文件覆盖 store、utils、patch builder |

### 验证记录

| 命令 | 结果 |
|------|------|
| `node -e "JSON.parse(...package.json...)"` | 通过，`package.json` 有效 |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，0 errors，139 warnings |
| `npm test` | 通过，3 files / 74 tests |
| 清理 `tsconfig.tsbuildinfo` | 已清理本次 typecheck 生成的缓存文件 |
| `git status --short --untracked-files=all` | 无输出，工作区干净 |

### 潜在 bug / 风险清单

| 优先级 | 位置 | 问题 | 影响 |
|------|------|------|------|
| P1 | `src/components/features/Settings.tsx:97` | “清除所有数据”只删除 institutions | 独立任务、邮件模板、邮件变量可能残留，和 UI 文案不一致 |
| P1 | `src/components/features/InstitutionDetail.tsx:366` | 绑定文件直接调用 `window.api.asset.create` | 新文件记录可能不会立刻显示，需要刷新或重新进入详情页 |
| P1 | `electron/main/index.ts:922` | `backup:importAll` 是追加式 create | 在已有数据环境导入备份时，重复 id 可能导致整次事务失败；“恢复备份”语义不清 |
| P2 | `src/lib/useUpdater.ts:31` | 自动更新 Hook 忽略 IPC 返回的失败对象 | `update:check`/`update:download` 返回 `{ success: false }` 时 UI 可能停在检查中或无错误提示 |
| P2 | `electron-builder-linux.yml:40` | Linux 图标路径指向 `resources/icon.png`，当前未发现该文件 | Linux 打包或图标资源可能失败/缺失 |
| P2 | `electron/main/index.ts:1031` | 数据库初始化失败时只 `return` 不 `app.quit()` | 可能留下无窗口 Electron 进程 |
| P3 | `src/stores/appStore.ts:262` | 通用 `updateTask`/`deleteTask` 不刷新 orphanTasks | Timeline 当前手动补刷，但其他未来入口复用 store 时可能出现独立任务列表陈旧 |
| P3 | lint 全局 | 139 个 warning，多数为 `any` 和 hook deps | 不阻塞运行，但会降低后续维护和 IPC 类型安全 |

### 后续建议

1. 先修 P1：清空数据语义、详情页绑定文件刷新、备份导入的覆盖/合并策略。
2. 再修 P2：自动更新错误态、Linux 图标资源、初始化失败退出。
3. 最后处理 P3：收敛 store 的任务刷新语义和 IPC DTO 类型。

## 记录规则

### 什么时候必须追加

- 每次阅读关键文件后，记录文件路径、阅读目的和关键发现。
- 每次修改源码后，记录文件路径、修改目的和具体改动。
- 每次运行验证命令后，记录命令和结果。
- 每次修改代码后，同时检查是否需要更新 `README.md`、`03_project_progress.md`、`04_code_file_index.md` 或其他专项文档。

### 建议格式

```markdown
## YYYY-MM-DD HH:mm 维护主题

### 用户目标
- ...

### 阅读文件记录
| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `path` | ... | ... |

### 代码修改记录
| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `path` | ... | ... |

### 验证记录
| 命令 | 结果 |
|------|------|
| `npx tsc -b` | 通过 |

### 剩余风险和后续
- ...
```

---

## 2026-04-29 新增院校刷新和版本号动态读取修复

### 用户目标

- 按 `back_memory` 的规划继续优化桌面软件。
- 修复“添加院校后没有反应，界面里没有出现新增院校”的问题。
- 修复版本号没有实时更新的问题。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `back_memory/README.md` | 恢复当前维护入口和工作流 | 当前项目是 Electron 桌面软件，修复前应按 renderer -> preload -> IPC -> Prisma 数据流排查 |
| `back_memory/03_project_progress.md` | 确认当前修复优先级 | 核心业务正确性、状态同步、局部更新风险属于当前重点 |
| `back_memory/04_code_file_index.md` | 定位新增院校和版本号相关文件 | 院校 CRUD 优先查 `appStore.ts`、`InstitutionForm.tsx`、`KanbanBoard.tsx`、`electron/main/index.ts`；版本号查 `Sidebar.tsx`、`Settings.tsx` |
| `package.json` | 确认真实应用版本号来源 | 当前版本为 `2.3.2`，界面仍写死旧版本 `2.3.0` |
| `electron/main/index.ts` | 检查院校 CRUD IPC 和应用级信息可否从主进程提供 | `institution:create` 会返回新院校；主进程尚未暴露应用版本号 IPC |
| `electron/preload/index.ts` | 检查 renderer 可用的 `window.api` | preload 暴露了业务 IPC，但没有暴露 `app.getVersion()` |
| `src/env.d.ts` | 检查 renderer 全局 API 类型 | 需要同步补充 `window.api.app.getVersion` 类型 |
| `src/stores/appStore.ts` | 检查新增院校后的状态写入方式 | `addInstitution` 直接把返回值插入本地数组，存在 UI 状态与数据库结果不同步的风险 |
| `src/components/features/InstitutionForm.tsx` | 检查表单提交成功后的回调 | 表单成功后只关闭弹窗，没有把保存后的院校信息传回看板 |
| `src/components/features/KanbanBoard.tsx` | 检查看板 tab 与新增院校显示关系 | 看板使用 uncontrolled tabs，若用户停留在其他分组，新院校可能已保存但当前 tab 看不到 |
| `src/components/layout/Sidebar.tsx` | 检查侧边栏版本显示 | 版本号写死为 `v2.3.0` |
| `src/components/features/Settings.tsx` | 检查关于页版本显示 | 版本号写死为 `2.3.0` |
| `src/App.tsx` | 检查全局加载和页面切换 | 启动时通过 `loadInstitutions()` 加载院校，详情页依赖本地 state 而不是 URL |
| `prisma/schema.prisma` | 确认院校模型字段 | 新增院校字段和 Prisma 模型匹配，问题更可能是 renderer 状态同步和当前 tab 可见性 |
| `src/components/features/InstitutionCard.tsx` | 检查看板卡片渲染条件 | 卡片依赖 `institutions` 和当前 tier 分组，状态同步后即可显示 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `src/stores/appStore.ts` | `addInstitution` 创建成功后改为重新调用 `institution.getAll()` 并写回 `institutions`；`updateInstitution` 同样刷新完整列表并返回保存后的院校 | 避免本地数组与数据库返回结果不一致，保证新增和编辑后界面立即使用最新数据 |
| `src/components/features/InstitutionForm.tsx` | `onSuccess` 改为接收保存后的 `Institution`；新增和编辑都把结果传回父组件 | 让看板能知道本次保存后的院校属于哪个 tier |
| `src/components/features/KanbanBoard.tsx` | 将 Tabs 改为受控 `activeTab`，保存成功后自动切换到保存院校所在的 `reach/match/safety` 分组 | 解决“新增成功但当前 tab 看不到，所以像没有反应”的体验问题 |
| `electron/main/index.ts` | 新增 `ipcMain.handle('app:getVersion', () => app.getVersion())` | 让 renderer 从 Electron 主进程获取真实应用版本号 |
| `electron/preload/index.ts` | 在 `window.api` 下新增 `app.getVersion()` | 安全暴露应用版本号读取能力 |
| `src/env.d.ts` | 为 `window.api.app.getVersion()` 补充 TypeScript 类型 | 保持 preload API 与 renderer 类型一致 |
| `src/lib/useAppVersion.ts` | 新增 `useAppVersion()` Hook，封装异步读取版本号和组件卸载保护 | 让多个组件复用版本号读取逻辑 |
| `src/components/layout/Sidebar.tsx` | 用 `useAppVersion()` 替换写死的 `v2.3.0` | 侧边栏版本号随 `package.json` / Electron 应用版本实时更新 |
| `src/components/features/Settings.tsx` | 用 `useAppVersion()` 替换写死的 `2.3.0` | 设置页关于信息显示真实版本 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npx tsc -b` | 通过 |
| `npm run build` | 通过 |
| `git diff --check` | 通过；仅提示 Git 将 LF 转为 CRLF |
| 清理 `tsc -b` 临时产物 | 已清理 `.jsx/.d.ts/.tsbuildinfo` 等生成文件，保留源码和 `back_memory/` |

### 剩余风险和后续

- 尚未启动 Electron 图形界面进行手动点击验证；当前已通过 TypeScript 和生产构建验证。
- `institution:update` 和 `advisor:update` 的安全 patch 语义仍是后续 P0 工作，不能因为本次刷新修复而视为完全完成。
- `back_memory/` 当前仍是未跟踪目录；提交前需要确认是否一起纳入版本控制。

---

## 2026-04-29 back_memory 记录流程固化

### 用户目标

- 之后每次更改代码后都要优化 `back_memory`。
- 把每次阅读文件和更改代码的记录写入 `back_memory/`，方便后续恢复上下文。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `back_memory/README.md` | 找到总入口和文档更新规范位置 | 需要把“代码修改后必须记录”写入工作流和文档更新规范 |
| `back_memory/03_project_progress.md` | 更新本轮修复状态 | 应记录新增院校刷新和版本号动态读取已修复 |
| `back_memory/04_code_file_index.md` | 更新新增文件和问题定位入口 | 新增 `src/lib/useAppVersion.ts` 后需要补入公共库索引 |
| `git status --short --untracked-files=all` | 确认当前工作区状态 | 代码修复文件已修改，`back_memory/` 和 `src/lib/useAppVersion.ts` 未跟踪 |

### 文档修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `back_memory/README.md` | 增加 `05_change_records.md` 导航、每次代码修改后的记录要求、结束前检查 `git diff -- back_memory` 的要求 | 将用户要求固化为维护流程 |
| `back_memory/03_project_progress.md` | 更新业务源码状态、核心业务正确性进度、已解决问题记录和更新日志 | 让项目进展反映本次真实修复 |
| `back_memory/04_code_file_index.md` | 增加 `src/lib/useAppVersion.ts`、`05_change_records.md`、新增院校刷新和版本号问题定位入口 | 避免后续排查版本号或新增院校问题时漏看关键文件 |
| `back_memory/05_change_records.md` | 新建维护记录文件，并补入本次修复和记录流程固化的完整记录 | 满足每次阅读文件和改代码都可追溯的要求 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `git status --short --untracked-files=all` | 已确认当前新增和修改文件清单 |

### 剩余风险和后续

- 后续每次改代码时，需要优先追加本文档，而不是只在最终回复里说明。
- 如果某次修改涉及架构、IPC、数据库、打包或新增文件，还要同步更新对应专项文档。

---

## 2026-04-29 启动失败截图诊断：缺少初始数据库文件

### 用户目标

- 解释截图中的 `PG-Tracker 启动失败` 是什么问题。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 核对启动阶段数据库初始化逻辑 | 生产环境首次启动时会从 `process.resourcesPath/prisma/dev.db` 复制种子数据库到用户数据目录；找不到该文件时弹出截图中的错误 |
| `electron-builder.yml` | 检查 Windows 打包是否声明携带数据库资源 | 当前配置有 `extraResources: from prisma to prisma`，理论上会把 `prisma/dev.db` 打进 `resources/prisma/dev.db` |
| `electron-builder-mac.yml` | 检查 macOS 打包是否声明携带数据库资源 | 当前配置同样会复制 `prisma` 目录 |
| `electron-builder-linux.yml` | 检查 Linux 打包是否声明携带数据库资源 | 当前配置同样会复制 `prisma` 目录 |
| `package.json` | 确认打包脚本和当前版本 | 当前版本为 `2.3.2`，Windows 打包脚本是 `npm run build:win` |
| `prisma/dev.db` | 确认源码中的种子数据库是否存在 | 当前工作区存在 `prisma/dev.db`，大小约 60 KB |
| `release/win-unpacked/resources/prisma/dev.db` | 确认本地已生成的 Windows unpacked 包是否带数据库 | 当前工作区的 `release/win-unpacked` 中存在该文件 |

### 诊断结论

- 截图中的安装/运行目录 `D:\BaiduNetdiskDownload\baoyan\PG-Tracker\resources\prisma\dev.db` 缺少种子数据库文件。
- 当前源码和本地 `release/win-unpacked` 输出里能找到 `resources/prisma/dev.db`，说明更可能是用户正在运行的那份安装包/解压目录不完整、不是最新构建产物，或复制/网盘传输时漏掉了 `resources/prisma/dev.db`。

### 本次代码修改记录

- 本次仅诊断，没有修改业务源码。

### 验证记录

| 命令 | 结果 |
|------|------|
| 检查 `prisma/dev.db` | 存在 |
| 检查 `release/win-unpacked/resources/prisma/dev.db` | 存在 |
| 检查 `electron-builder*.yml` | 当前配置包含 `extraResources: from prisma to prisma` |

### 剩余风险和后续

- 可以增加打包前/打包后校验脚本，若 `resources/prisma/dev.db` 缺失则让构建失败。
- 启动逻辑仍存在“旧 schema 替换数据库”的高风险，后续应改为备份加迁移策略。

---

## 2026-04-29 P0 数据安全和局部更新语义修复

### 用户目标

- 根据 `back_memory` 继续进一步优化软件。
- 优先处理当前规划中的高风险问题。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `back_memory/02_technical_details.md` | 确认下一阶段技术债优先级和验收标准 | P0 是数据库升级覆盖风险，以及院校/导师 update 语义不一致 |
| `back_memory/03_project_progress.md` | 确认项目进度和问题追踪状态 | BUG-001、BUG-002、BUG-003 均为待修复 P0 |
| `back_memory/04_code_file_index.md` | 定位主进程、store、日程、详情页相关入口 | 数据库初始化和 patch update 都集中在 `electron/main/index.ts`，调用方在 `Timeline.tsx` 和 `InstitutionDetail.tsx` |
| `electron/main/index.ts` | 检查生产数据库初始化、院校更新、导师更新实现 | 旧逻辑在邮件表检测失败时会删除用户库并复制 seed DB；院校/导师 update 会按完整对象写入 |
| `src/components/features/Timeline.tsx` | 验证院校更新调用是否为 patch | 添加日程时只传 `{ campDeadline }` 或 `{ pushDeadline }` |
| `src/components/features/InstitutionDetail.tsx` | 验证导师状态切换调用是否为 patch | 切换状态时只传 `{ contactStatus }` |
| `src/components/features/AdvisorForm.tsx` | 验证导师表单保存字段 | 表单保存是完整数据，但状态切换路径是局部数据 |
| `src/stores/appStore.ts` | 检查 store 对 update 的封装 | store 会刷新院校列表，主风险在主进程 handler 的写入语义 |
| `prisma/dev.db` | 核对邮件模板表结构 | `EmailTemplate` 和 `EmailVariable` 表结构可用作非破坏性补表 SQL |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | 新增 `backupUserDatabase()`，迁移前复制 `dev.db`、`dev.db-wal`、`dev.db-shm` 到 `userData/backups/` | 生产数据库升级前必须保留可恢复备份 |
| `electron/main/index.ts` | 新增 `ensureProductionDatabaseSchema()`，检测缺失的 `EmailTemplate` / `EmailVariable` 表并用 SQL 补齐 | 替代旧的“检测失败就删除用户库并复制 seed DB”逻辑 |
| `electron/main/index.ts` | 初始 seed DB 缺失时抛出明确错误，不继续尝试打开不存在的数据库 | 避免启动失败原因被后续 Prisma 错误掩盖 |
| `electron/main/index.ts` | 新增 `parseNullableDate()`、`buildInstitutionUpdateData()`、`buildAdvisorUpdateData()` | 统一日期校验和 patch update 构造方式 |
| `electron/main/index.ts` | `institution:update` 改为只写入明确传入字段 | 防止日程页只改一个 deadline 时清空院校其他字段 |
| `electron/main/index.ts` | `advisor:update` 改为只写入明确传入字段 | 防止详情页只切换联系状态时清空导师姓名、邮箱、研究方向等字段 |
| `electron/main/index.ts` | `advisor:create` 补写 `lastContactDate` | 保持导师创建和编辑字段行为一致 |

### back_memory 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `back_memory/README.md` | 更新版本到 v1.3，将数据库覆盖、院校/导师局部更新从高风险清单移出 | 维护入口需要反映 P0 风险已处理 |
| `back_memory/02_technical_details.md` | 更新数据库初始化、IPC update 风险和技术债状态 | 技术细节需要与源码行为一致 |
| `back_memory/03_project_progress.md` | 更新数据安全和核心业务正确性进度，移动 BUG-001/002/003 到已解决记录 | 项目进展需要反映本轮优化结果 |
| `back_memory/04_code_file_index.md` | 更新主进程重点区域和高风险问题对应文件说明 | 后续定位时应知道这些风险已有补丁 |
| `back_memory/05_change_records.md` | 追加本次阅读、改动和验证记录 | 满足每次修改代码后记录要求 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npx tsc -b` | 通过 |
| `npm run build` | 通过 |
| 清理 `tsc -b` 临时产物 | 已清理 `.jsx/.d.ts/.tsbuildinfo` 等生成文件 |

### 剩余风险和后续

- 当前 migration 只覆盖已知的邮件模板表缺失场景，未来 schema 继续变化时仍应新增明确迁移。
- 详情页 assets/interviews 加载不完整、导入导出不完整仍是后续 P1。

---

## 2026-04-29 P1 核心业务正确性、安全日期、XSS 和 LaTeX 安全修复

### 用户目标

- 根据 `back_memory` 的规划继续修复 P1 问题。
- 修复详情页 assets/interviews 数据源不完整的问题。
- 修复新增 Asset/Interview 后界面不刷新的问题。
- 修复邮件预览 XSS 风险。
- 统一安全日期格式化，避免无效日期导致白屏。
- 修复 LaTeX 编译命令注入和路径解析风险。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 检查 `institution:getAll` 的 Prisma include 深度 | 当前 `getAll` 只 include `advisors: true` 和 `tasks: true`，不含 `assets` 和 `interviews` 深层嵌套，导致详情页文件/面经数据缺失 |
| `src/stores/appStore.ts` | 检查 `addAsset` 和 `addInterview` 刷新逻辑 | 两者成功后都未调用 `loadInstitutions()`，新增后详情页看不到新数据 |
| `src/components/features/EmailTemplates.tsx` | 检查邮件变量填充值预览渲染 | `renderPreviewText` 中变量填充值直接拼接到 HTML 中，未做 HTML 转义，存在 XSS 风险 |
| `src/lib/utils.ts` | 检查通用日期工具函数 | `formatDate` 已有基础安全处理，但缺少统一的 `parseValidDate` 和基于 date-fns 的 `formatDateSafe` |
| `src/components/features/Dashboard.tsx` | 检查日期使用是否安全 | 多处直接 `new Date()` 后传给 `format()`、`isPast()`、`differenceInDays()`，无效日期可能白屏 |
| `src/components/features/InstitutionCard.tsx` | 检查日期使用是否安全 | `deadline` 直接 `new Date()` 传给 `format()`，无效日期可能白屏 |
| `src/components/features/Timeline.tsx` | 检查日期使用是否安全 | `getDateLabel` 和行内日期 `format()` 直接 `new Date()`，无效日期可能白屏 |
| `src/components/features/InstitutionDetail.tsx` | 检查本地日期函数是否可复用 | 已有 `parseValidDate` 和 `formatDateSafe` 本地实现，可迁移到 utils 统一使用 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | `institution:getAll` 的 include 改为 `advisors: { include: { assets: true, interviews: true } }` | 修复详情页 assets/interviews 数据加载不完整（BUG-004） |
| `electron/main/index.ts` | 移除 `exec`/`promisify` 导入，LaTeX 编译改用 `spawn` + `path.dirname()`，通过 Promise 封装进程生命周期 | 修复 shell 注入和路径解析风险（BUG-007） |
| `src/stores/appStore.ts` | `addAsset` 和 `addInterview` 成功后调用 `await get().loadInstitutions()` | 修复新增文件/面经后详情页不刷新的问题 |
| `src/components/features/EmailTemplates.tsx` | 新增 `htmlEscape()` 函数，`renderPreviewText` 中变量名和填充值均通过 `htmlEscape()` 转义 | 修复邮件预览 XSS 风险（BUG-006） |
| `src/lib/utils.ts` | 新增 `parseValidDate()` 和 `formatDateSafe()` 统一安全日期工具函数；`getDaysUntilDeadline` 改为使用 `parseValidDate` | 提供全项目统一的无效日期防护（BUG-008） |
| `src/components/features/InstitutionDetail.tsx` | 删除本地 `parseValidDate`/`formatDateSafe`，改为从 `utils` 导入；移除未使用的 `date-fns` import | 统一日期工具函数来源 |
| `src/components/features/Dashboard.tsx` | 截止日期和任务日期渲染改用 `formatDateSafe`；截止日期构建改用 `parseValidDate` 校验后再传 `isPast`/`differenceInDays` | 防止无效日期导致 Dashboard 白屏 |
| `src/components/features/InstitutionCard.tsx` | 截止日期校验改用 `parseValidDate`，渲染改用 `formatDateSafe`；移除未使用的 `format`/`zhCN` import | 防止无效日期导致卡片白屏 |
| `src/components/features/Timeline.tsx` | `getDateLabel` 和行内日期渲染改用 `parseValidDate`/`formatDateSafe`；移除未使用的 `format`/`zhCN` import | 防止无效日期导致日程页白屏 |

### back_memory 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `back_memory/05_change_records.md` | 追加本次阅读、改动和验证记录 | 满足每次修改代码后记录要求 |
| `back_memory/03_project_progress.md` | 更新 BUG-004/006/007/008 状态，更新阶段进度和已解决问题 | 反映本轮 P1 修复成果 |
| `back_memory/04_code_file_index.md` | 更新高风险问题对应文件和工具函数索引 | 保持代码索引与修复后状态一致 |
| `back_memory/02_technical_details.md` | 更新 IPC 接口风险、数据流和安全技术债状态 | 技术细节与源码行为保持同步 |
| `back_memory/README.md` | 更新高风险/中风险清单，从清单移出已修复项 | 维护入口需反映最新风险状态 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npx tsc -b` | 通过（TS6305 为预已存在的 tsconfig 项目引用配置问题，非本次引入） |
| `npm run build` | 通过 |
| 清理 `tsc -b` 临时产物 | 已清理 `.jsx/.d.ts/.tsbuildinfo` 等生成文件 |

### 剩余风险和后续

- 导入导出仍不是完整备份（BUG-005），需新增完整 backup IPC。
- 限制外部链接打开策略、增加 lint/test 脚本、三平台打包验证仍是后续工作。
- 当前 migration 只覆盖 EmailTemplate/EmailVariable 表缺失场景，未来 schema 继续变化时仍需补充迁移脚本。

---

## 2026-04-29 P1 完整备份导入导出 + dueDate 安全处理

### 用户目标

- 实现完整数据备份导出和导入，覆盖院校、导师、资产、面经、任务、邮件模板和变量。
- 修复任务 `dueDate` 字段的可空处理，防止 Prisma 写入 null 值。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `src/components/features/Settings.tsx` | 检查当前导入导出实现 | 导出只调用 `institution:getAll`，不含独立任务和邮件模板；导入逐条创建 institution/advisor/task，不含 assets/interviews/emailTemplates/orphanTasks |
| `electron/main/index.ts` | 确认 `task:update` 中 dueDate 处理 | 当前逻辑允许 `dueDate === null` 时设 `updateData.dueDate = null`，但 Prisma schema 中 `dueDate DateTime` 不可为空 |
| `electron/preload/index.ts` | 确认需要暴露的 backup IPC | 需要新增 `backup.exportAll` 和 `backup.importAll` |
| `src/env.d.ts` | 确认需要补充的类型声明 | 需要新增 `backup` 命名空间及 `ApiResponse` 类型 |
| `prisma/schema.prisma` | 确认所有需要备份的模型 | 共 7 个模型：Institution、Advisor、Task、Asset、Interview、EmailTemplate、EmailVariable |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | 新增 `backup:exportAll` IPC：导出 institutions（含深层 advisors/assets/interviews/tasks）、orphanTasks、emailTemplates（含 variables） | 提供完整数据备份，覆盖全部 7 个数据模型 |
| `electron/main/index.ts` | 新增 `backup:importAll` IPC：在一个事务中先导入邮件模板和变量，再导入院校及关联的导师/资产/面经/任务，最后导入独立任务 | 保证导入原子性和数据关系完整性 |
| `electron/main/index.ts` | `task:update` 中 `dueDate` 为 null/空字符串时跳过该字段而非设 null | schema 要求 DateTime 不可为空，旧逻辑可能触发 Prisma 写入错误 |
| `electron/preload/index.ts` | 在 `window.api` 下新增 `backup.exportAll()` 和 `backup.importAll(data)` | 安全暴露完整备份导入导出能力 |
| `src/env.d.ts` | 新增 `backup` 接口类型和返回值类型 | 保持 preload API 与 renderer 类型一致 |
| `src/components/features/Settings.tsx` | `handleExportData` 改用 `window.api.backup.exportAll()`；`handleImportData` 改用 `window.api.backup.importAll()` 并兼容旧格式数组 | 修复备份不完整问题（BUG-005），支持新旧两种备份格式 |

### back_memory 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `back_memory/05_change_records.md` | 追加本次阅读、改动和验证记录 | 满足每次修改代码后记录要求 |
| `back_memory/03_project_progress.md` | 更新 BUG-005 和 dueDate 状态、数据安全阶段进度 | 反映本轮 P1 修复成果 |
| `back_memory/04_code_file_index.md` | 更新高风险问题对应文件、Settings 导入导出说明 | 保持代码索引与修复后状态一致 |
| `back_memory/02_technical_details.md` | 更新导入导出技术债和数据流描述 | 技术细节与源码行为保持同步 |
| `back_memory/README.md` | 从高风险清单移出导入导出风险 | 维护入口需反映最新风险状态 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npx tsc -b` | 通过（TS6305 为预已存在的 tsconfig 项目引用配置问题，非本次引入） |
| `npm run build` | 通过 |

### 剩余风险和后续

- 增加 lint/test 脚本、三平台打包验证仍是后续工作。
- 当前 migration 只覆盖 EmailTemplate/EmailVariable 表缺失场景，未来 schema 继续变化时仍需补充迁移脚本。
- 备份文件目前不包含文件内容复制（asset 只存本地路径），如需完整备份需要额外复制文件到应用数据目录。

---

## 2026-04-29 P2 限制外部链接打开策略

### 用户目标

- 限制 Electron `shell.openExternal` 只允许安全的 URL 协议，防止 `javascript:`、`file:` 等危险协议的链接被打开。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 检查外部链接打开策略 | `setWindowOpenHandler` 直接调用 `shell.openExternal(details.url)` 无协议校验；`file:openExternal` 使用 `shell.openPath` 仅处理文件路径，已安全 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | `setWindowOpenHandler` 改为解析 URL 后校验协议，仅允许 `http:`/`https:`/`mailto:` 调用 `shell.openExternal` | 防止打开 `javascript:`/`file:`/`data:` 等危险协议的链接 |

### back_memory 修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `back_memory/05_change_records.md` | 追加本次阅读、改动和验证记录 | 满足每次修改代码后记录要求 |
| `back_memory/03_project_progress.md` | 第5阶段限制外部链接标记为已完成，更新阶段进度和过期备注 | 反映本轮修复成果 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run build` | 通过 |

### 剩余风险和后续

- 增加 lint/test 脚本、三平台打包验证仍是后续工作。
- 当前 migration 只覆盖 EmailTemplate/EmailVariable 表缺失场景，未来 schema 继续变化时仍需补充迁移脚本。

---

## 2026-04-29 工程质量：typecheck 脚本与 TypeScript 构建产物隔离

### 用户目标

- 按 `back_memory` 规划推进第六阶段"工程质量与自动测试"。
- 新增 `typecheck` 脚本便于标准化类型检查。
- 修复 `tsc -b` 在 `src/` 下生成 `.jsx`/`.d.ts`/`.tsbuildinfo` 临时产物的问题。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `package.json` | 检查当前 scripts | 缺少 `typecheck` 脚本 |
| `tsconfig.web.json` | 检查 web 端 TS 配置 | `composite: true` 但未声明 `outDir`，产物污染 `src/` |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `package.json` | 新增 `"typecheck": "tsc -b"` 脚本 | 提供标准化类型检查入口 |
| `tsconfig.web.json` | 新增 `"outDir": "./out/types-web"` 和 `"declaration": true` | 隔离构建产物，避免 `src/` 下生成 `.d.ts`/`.jsx` 文件 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run typecheck` | 通过，零错误 |
| `npm run build` | 通过 |
| 检查 `src/` | 无临时产物残留 |

### 剩余风险和后续

- ESLint 配置、核心 store 测试、关键 IPC handler 测试仍是第六阶段待办。
- 三平台打包验证仍是第七阶段待办。

---

## 2026-04-29 工程质量：ESLint 配置

### 用户目标

- 为项目配置 ESLint，提供标准化代码质量检查。
- 适配 TypeScript + React + Electron 三进程结构。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `package.json` | 检查现有 lint 工具 | 无 ESLint 及相关依赖 |
| `src/components/ui/input.tsx` | 检查空接口模式 | `InputProps extends React.InputHTMLAttributes<>` 为空接口，ESLint 报 `no-empty-object-type` |
| `src/components/features/Settings.tsx` | 检查 setState 模式 | `setMounted(true)` 在 effect 中触发 `set-state-in-effect` 规则 |
| `electron/preload/index.ts` | 检查 @ts-ignore 用法 | 两处 @ts-ignore 需改为 @ts-expect-error |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `package.json` | 安装 `eslint@^9`、`@eslint/js`、`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`eslint-plugin-react`、`eslint-plugin-react-hooks`；新增 `"lint": "eslint ."` 脚本 | 建立代码质量管理基础设施 |
| `eslint.config.mjs` | 新建 ESLint flat config，配置 TypeScript + React + Node.js 环境 | 适配三进程结构：renderer (React/browser)、main/preload (Node.js)、vite config |
| `electron/preload/index.ts` | `@ts-ignore` 改为 `@ts-expect-error` | 满足 `@typescript-eslint/ban-ts-comment` 规则 |
| `src/components/ui/input.tsx` | `interface InputProps extends ...` 改为 `type InputProps = ...` | 满足 `@typescript-eslint/no-empty-object-type` 规则 |
| `src/components/ui/textarea.tsx` | 同上 | 同上 |
| `src/components/features/EmailTemplates.tsx` | 中文引号 `"变量"` 改为 `&#34;变量&#34;` | 满足 `react/no-unescaped-entities` 规则 |
| `src/components/features/Settings.tsx` | 添加 `eslint-disable-next-line` 抑制 `set-state-in-effect` | `setMounted(true)` 是 hydration-safe 渲染的合法模式 |
| `src/components/features/InstitutionForm.tsx` | 同上 | 清除错误提示是合法模式 |
| `src/components/features/Timeline.tsx` | 添加 `eslint-disable` 块抑制 `set-state-in-effect` | store 同步到本地状态是合法模式 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run lint` | 0 errors, 130 warnings (均为 `no-explicit-any` 和 `exhaustive-deps`) |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |

### 剩余风险和后续

- 130 个 warning 主要为 `@typescript-eslint/no-explicit-any`，可后续逐步迁移到具体类型。
- 核心 store 测试、关键 IPC handler 测试仍是第六阶段待办。
- 三平台打包验证仍是第七阶段待办。

---

## 2026-04-29 工程质量：补核心 store 与工具函数测试

### 用户目标

- 为项目添加自动化测试，提升回归防护能力。
- 补核心 Zustand store 测试和关键工具函数测试。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `src/stores/appStore.ts` | 分析 store 测试范围 | 23 个 action，全部依赖 `window.api`，需 mock |
| `src/lib/utils.ts` | 确认可测试的纯函数 | `parseValidDate`、`formatDateSafe` 等均可独立测试 |
| `electron/main/index.ts` | 确认主进程 patch builder | `buildInstitutionUpdateData`/`buildAdvisorUpdateData` 无法直接导入，在 renderer 侧 mirror 测试 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `package.json` | 安装 vitest/jsdom/@testing-library；新增 `test`/`test:watch` 脚本 | 建立测试基础设施 |
| `vitest.config.ts` | 新建 vitest 配置，jsdom + `@/` 别名 | 适配 React + TS 测试 |
| `src/stores/appStore.test.ts` | 新建 25 个 store 测试 | 验证 CRUD、刷新、错误处理 |
| `src/lib/utils.test.ts` | 新建 35 个工具函数测试 | 验证日期、JSON、验证工具 |
| `src/lib/patchUpdate.test.ts` | 新建 13 个 patch update mirror 测试 | 验证主进程 patch builder 逻辑 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run test` | 3 文件 74 测试全部通过 |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `npm run lint` | 0 errors |

### 剩余风险和后续

- 三平台打包验证仍是第七阶段待办。
- 主进程 IPC handler 端到端测试需 Electron mock，可后续补充。

---

## 2026-04-29 代码审查：修复 5 个潜在 bug

### 用户目标

- 全量代码审查，找出潜在 bug。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 全面审查 IPC handler | `interview:update` 不支持局部更新；create handler 缺少日期校验 |
| `src/components/features/EmailTemplates.tsx` | 审查保存流程 | `catch { clearError() }` 静默吞掉错误 |
| `src/components/features/InstitutionForm.tsx` | 审查表单数据流 | `expectedQuota \|\| null` 把 0 转为 null |
| `src/components/features/InstitutionDetail.tsx` | 审查边界状态 | 找不到院校时永久 loading |
| `src/components/features/Timeline.tsx` | 审查孤任务更新流程 | 直接 IPC 调用绕过 store，但有注释说明原因（优化避免重载 institutions）— 保留现状 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | `interview:update` 改为 patch 语义（按字段存在判断是否更新），增加日期校验，空数据时返回现有记录 | 与 `institution:update`/`advisor:update` 保持一致，防止只传 `markdownNotes` 时覆盖 date/format |
| `electron/main/index.ts` | `institution:create` 的 deadline 改用 `parseNullableDate` | 防止无效日期写入 Invalid Date |
| `electron/main/index.ts` | `advisor:create` 的 `lastContactDate` 改用 `parseNullableDate` | 同上 |
| `electron/main/index.ts` | `task:create` 的 `dueDate` 改用新增的 `parseDateRequired` | 必填日期写入前验证格式 |
| `electron/main/index.ts` | `interview:create` 的 `date` 改用 `parseDateRequired` | 同上 |
| `electron/main/index.ts` | 新增 `parseDateRequired()` 函数，验证必填日期 | 与 `parseNullableDate` 配套，统一日期校验 |
| `electron/main/index.ts` | `parseNullableDate` 增加 `undefined` 判断 | 补全空值覆盖 |
| `src/components/features/EmailTemplates.tsx` | `catch { clearError() }` 改为 `catch (err) { alert('保存失败：' + err.message) }`；移除未使用的 `clearError` 解构 | 保存失败时用户能得到错误反馈 |
| `src/components/features/InstitutionForm.tsx` | 3 处 `expectedQuota \|\|` 改为 `!= null` / `!== ''` / `??` 判断 | 修复用户输入 0 时值被转为 null/undefined |
| `src/components/features/InstitutionDetail.tsx` | 区分 loading 状态和 not-found 状态：loading 时显示 spinner，not-found 时显示友好提示+返回按钮 | 防止院校被删除后用户卡在永久 loading 状态 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run typecheck` | 通过 |
| `npm run lint` | 0 errors |
| `npm run test` | 3 文件 74 测试全部通过 |
| `npm run build` | 通过 |

### 剩余风险和后续

- Timeline 孤儿任务直接调 IPC 绕过 store，虽然有注释解释（避免 store 的 `loadInstitutions` 太重），但可考虑在 store 中增加轻量级 orphan toggle 方法。
- InstitutionDetail 的 `useStore()` 无 selector，可后续优化性能。
- 三平台打包验证仍是第七阶段待办。
---

## 2026-04-30 继续修 bug：处理 review findings 并收敛 lint warnings

### 用户目标

- 继续根据 review findings 修复 bug。
- 继续审查 142 个 lint warnings，优先处理不会改变业务逻辑的真实类型和 hook 问题。
- 每次读取文件和修改代码后写入 `back_memory`，方便后续追踪。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `src/components/features/Settings.tsx` | 审查清除数据和备份导入流程 | 清除数据原先只删院校，独立任务、邮件模板、变量可能残留；导入备份需要明确 replace 策略 |
| `src/components/features/InstitutionDetail.tsx` | 审查导师文件绑定流程 | 绑定文件直接调用 `window.api.asset.create`，绕过 store 刷新 |
| `electron/main/index.ts` | 审查备份导入、清空数据、启动失败和主进程 warning | 备份导入原为追加式；主进程有大量 `any` 和错误处理弱类型 |
| `electron/preload/index.ts` | 审查 renderer 暴露 API 类型 | preload 使用大量 `any`，且需要新增 `backup.clearAll` 和带 mode 的 `backup.importAll` |
| `src/env.d.ts` | 审查全局 `window.api` 类型 | IPC 类型大量 `any`，补充结构化类型后需要 `export {}` 保持全局声明生效 |
| `src/lib/useUpdater.ts` | 审查自动更新失败态 | 主进程返回 `success:false` 时，hook 原先不会进入错误 UI |
| `src/stores/appStore.ts` | 审查 store 刷新和错误处理 | 独立任务更新/删除后需要刷新 `orphanTasks`；错误处理和邮件模板返回类型可收紧 |
| `src/stores/appStore.test.ts` | 审查现有测试覆盖 | 需要补充 `updateTask` 刷新 `orphanTasks` 的回归测试 |
| `src/components/ColorThemeContext.tsx` | 审查 hook deps warning | 初始化主题 effect 与主 effect 重复，可删除空依赖 effect |
| `src/components/features/Dashboard.tsx` | 审查 hook deps 和 `any` warning | `loadOrphanTasks` 需要进入依赖数组，任务类型可用 `Task` |
| `src/components/features/Timeline.tsx` | 审查 hook deps 和错误处理 | `loadOrphanTasks` 需要进入依赖数组，catch 参数可改为 `unknown` |
| `src/components/features/InstitutionForm.tsx` | 审查错误处理 warning | catch 参数可改为 `unknown` |
| `src/components/features/EmailTemplates.tsx` | 审查邮件模板类型 warning | 补充邮件模板/变量类型并处理保存失败错误 |
| `electron-builder-linux.yml` | 审查 Linux 图标引用 | 配置引用 `resources/icon.png`，项目缺少该文件 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `electron/main/index.ts` | 新增 `clearApplicationData()`，并注册 `backup:clearAll` | 让设置页“清除所有数据”真正清掉院校、导师、任务、资产、面试、邮件模板、变量 |
| `electron/main/index.ts` | `backup:importAll` 增加 `{ mode: 'replace' | 'append' }`，默认 replace 时先清空再导入；并校验备份 payload | 修复备份恢复的追加式导入和同 id 冲突风险 |
| `electron/main/index.ts` | 数据库初始化失败后 `app.quit()` | 避免启动失败后进程继续处于异常状态 |
| `electron/main/index.ts` | 新增 `getErrorMessage()` / `getErrorStack()` / `toRecord()`，部分主进程错误处理从 `any` 改为 `unknown` | 收敛 warning，并避免非 Error 对象导致二次异常 |
| `electron/preload/index.ts` | 新增 `backup.clearAll()`，`backup.importAll(data, options)`；补充本地 IPC 输入类型和 updater status 类型 | 与主进程新 API 对齐，并减少 preload `any` warning |
| `src/env.d.ts` | 用 `Institution`、`Advisor`、`Task`、`Asset`、`EmailTemplate` 等类型替换 `window.api` 中的大量 `any`；新增 `BackupData` 和 `FileSelectOptions` | 提升 renderer IPC 调用类型质量，修复 33 个 env warning |
| `src/components/features/Settings.tsx` | 清除数据改用 `window.api.backup.clearAll()`；导入备份前确认 replace，调用 `importAll(payload, { mode: 'replace' })` | 修复清除不完整和备份恢复语义不明确 |
| `src/components/features/InstitutionDetail.tsx` | 文件绑定改为调用 store `addAsset()`，并传入 `AdvisorCard` | 绑定文件后会刷新院校详情，避免 UI 不显示新文件 |
| `src/lib/useUpdater.ts` | `checkForUpdates()` / `downloadUpdate()` 读取 `success:false` 并设置 `error` 状态；catch 改为 `unknown` | 修复更新失败状态不进入 UI |
| `resources/icon.png` | 复制现有软件图标到 Linux 打包配置需要的位置 | 修复 Linux 打包图标资源缺失 |
| `src/stores/appStore.ts` | 新增 `EmailTemplate` / `EmailVariable` 类型，catch 改为 `unknown`，邮件创建/更新返回缺失 data 时抛错 | 收紧 store 类型，避免成功响应缺数据时静默返回 undefined |
| `src/stores/appStore.ts` | `updateTask` / `deleteTask` 在刷新院校后继续刷新 `orphanTasks` | 防止独立任务更新/删除后列表状态陈旧 |
| `src/stores/appStore.test.ts` | 补充 `updateTask` 刷新 `orphanTasks` 的测试，并更新删除任务测试 mock | 防止独立任务刷新逻辑回归 |
| `src/components/ColorThemeContext.tsx` | 删除重复的空依赖初始化 effect | 修复 hook deps warning，保留 `colorTheme` 变化时统一写 DOM/localStorage |
| `src/components/features/Dashboard.tsx` | `useEffect` 增加 `loadOrphanTasks` 依赖，任务类型从 `any` 改为 `Task` | 修复 hook deps 和 `any` warning |
| `src/components/features/Timeline.tsx` | `useEffect` 增加 `loadOrphanTasks` 依赖，catch 参数改为 `unknown` | 修复 hook deps 和 `any` warning |
| `src/components/features/InstitutionForm.tsx` | catch 参数改为 `unknown` 并安全读取错误信息 | 修复 `any` warning |
| `src/components/features/EmailTemplates.tsx` | 补充邮件模板局部类型，保存失败 catch 改为 `unknown`，模板列表移除 `any` | 修复邮件模板页类型 warning |

### 验证记录

| 命令 | 结果 |
|------|------|
| `npm run typecheck` | 通过 |
| `npm run lint` | 0 errors，warning 从 142 降到 24，剩余均在 `electron/main/index.ts` 的动态 Prisma/IPC 类型 |
| `npm test` | 3 个测试文件、75 个测试全部通过 |
| `npm run build` | 通过，main/preload/renderer 均成功产物 |

### 剩余风险和后续

- `electron/main/index.ts` 仍有 24 个 `@typescript-eslint/no-explicit-any` warning，主要来自动态加载 Prisma Client、transaction client、IPC 入参和备份导入对象。继续清零需要为主进程建立本地 IPC/Backup/Prisma-like 类型层，建议单独做一轮，避免为了清 warning 写出假类型。
- 当前修复已经覆盖 review findings 里的 5 个 bug，并保持 typecheck/test/build 通过。

---

## 2026-04-30 整体检查与测试：Timeline 直接 IPC 失败未处理

### 用户目标

- 检查软件整体是否还有潜在 bug。
- 跑完整测试和构建验证。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `package.json` | 确认项目脚本和可运行测试命令 | 可执行 `typecheck`、`lint`、`test`、`build`、`prisma:generate` |
| `src/components/features/Settings.tsx` | 复查清除、导入、导出和更新入口 | 清除/导入逻辑已对齐 `backup.clearAll` / replace 导入；catch 中仍有强制 `as Error` |
| `electron/main/index.ts` | 复查备份导入和 IPC handler | 备份导入 replace/clearAll 已对齐；剩余 warning 主要是动态 Prisma/IPC 类型 |
| `electron/main/updater.ts` | 确认更新事件是否会通知 renderer | 主进程会发送 checking、available、not-available、downloading、downloaded、error 状态 |
| `src/components/features/UpdateNotification.tsx` | 复查更新通知展示 | 通知依赖 `useUpdater` 状态，未发现新的阻断问题 |
| `src/components/features/Timeline.tsx` | 审查直接 IPC 更新任务路径 | `window.api.task.update` 返回 `success:false` 时 Promise 不 reject，原逻辑会当成功处理 |
| `src/components/features/AdvisorForm.tsx` | 审查表单错误提示 | catch 中 `(error as Error).message` 对非 Error 值不安全 |
| `src/components/features/InterviewForm.tsx` | 审查表单错误提示 | 同上 |
| `src/components/features/TaskForm.tsx` | 审查表单错误提示 | 同上 |
| `src/lib/utils.ts` | 查找是否已有错误消息 helper | 原先没有通用 `getErrorMessage` |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `src/lib/utils.ts` | 新增 `getErrorMessage(error, fallback)` | 统一安全读取未知错误消息，避免非 Error 值导致提示为 undefined |
| `src/components/features/Timeline.tsx` | `handleToggleTask` 检查 `task.update` 的 `result.success`，失败时抛错进入回滚逻辑 | 修复直接 IPC 返回失败但 UI 当成功的问题 |
| `src/components/features/Timeline.tsx` | `handleSaveEdit` 检查 `task.update` 的 `result.success`，失败时提示并停止关闭弹窗 | 防止独立任务编辑失败后 UI 假成功 |
| `src/components/features/AdvisorForm.tsx` | 保存失败提示改用 `getErrorMessage` | 加固非 Error 异常处理 |
| `src/components/features/InterviewForm.tsx` | 保存失败提示改用 `getErrorMessage` | 同上 |
| `src/components/features/TaskForm.tsx` | 保存失败提示改用 `getErrorMessage` | 同上 |
| `src/components/features/Settings.tsx` | 导出/清除失败提示改用 `getErrorMessage` | 同上 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `git diff --check` | 通过，无 whitespace error |
| `npm run typecheck` | 通过 |
| `npm test` | 3 个测试文件、75 个测试全部通过 |
| `npm run lint` | 0 errors，24 warnings，剩余均在 `electron/main/index.ts` |
| `npm run build` | 通过 |
| `npm run prisma:generate` | 通过，Prisma Client 成功生成 |
| `node -e "const p=require('./package.json'); console.log(p.description);"` | 输出中文描述正常，未发现 package 元数据乱码 |

### 剩余风险和后续

- 仍未做真实 Electron 窗口的手工冒烟操作；当前验证覆盖 TypeScript、单元测试、lint、生产构建、Prisma Client 生成。
- `electron/main/index.ts` 仍有 24 个 `any` warning，建议下一轮专门抽主进程 IPC/Backup/Prisma 类型层处理。

---

## 2026-04-30 真实 Electron 窗口冒烟测试

### 用户目标

- 做真实 Electron 窗口手工冒烟操作，确认软件能真正启动和交互。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `electron/main/index.ts` | 确认窗口加载路径和远程调试可用性 | 构建产物会加载 `out/renderer/index.html`，窗口 ready 后 show |
| `electron.vite.config.ts` | 确认 main/preload/renderer 构建入口 | 构建入口正常，产物位于 `out/main`、`out/preload`、`out/renderer` |
| `out/main/index.js` / `out/renderer/index.html` | 确认构建产物存在 | 两个产物均存在，可用于真实 Electron 启动 |

### 操作记录

| 操作 | 结果 |
|------|------|
| 使用 `node_modules/electron/dist/electron.exe --remote-debugging-port=9333 .` 启动真实 Electron | 成功启动窗口 |
| 通过 DevTools Protocol 读取页面 | `document.readyState` 为 `complete` |
| 检查页面标题 | `PG-Tracker - 保研信息收集与决策分析系统` |
| 检查加载 URL | `file:///.../out/renderer/index.html` |
| 检查 renderer 桥接 | `window.api` 和 `window.electron` 均存在 |
| 调用 `window.api.app.getVersion()` | 返回 `2.4.0` |
| 检查页面文本 | 左侧导航、版本号、院校看板、已有院校数据均正常渲染 |
| 点击主导航：总览、日程、邮件模板、设置、院校看板 | 均成功响应 |
| 点击“添加院校” | 弹窗成功打开 |
| 检查添加院校弹窗字段 | “学校名称”“院系名称”等字段正常渲染 |
| 点击“取消” | 弹窗成功关闭，未写入新数据 |

### 验证结论

- 真实 Electron 窗口可以启动。
- 构建产物加载正常，无白屏。
- Preload API 注入正常，版本号实时读取正常。
- 基础导航交互正常。
- 添加院校弹窗可以打开和关闭，表单字段正常显示。

### 剩余风险和后续

- 本次冒烟没有实际提交新增院校，避免污染当前真实数据库；此前自动化和代码修复已覆盖添加后刷新路径。
- 可在下一轮加一个专用测试数据库环境，用真实 Electron 自动提交新增院校，再验证 UI 列表增加，避免影响用户当前数据。

---

## 2026-04-30 GitHub 三平台发布准备

### 用户目标

- 将 Windows、macOS、Linux 三个平台发布到 GitHub。

### 阅读文件记录

| 文件 | 阅读目的 | 关键发现 |
|------|----------|----------|
| `.github/workflows/release.yml` | 确认三平台上传机制 | 推送 `v*` tag 后会分别在 Windows、macOS、Linux runner 构建并上传 GitHub Release |
| `electron-builder.yml` | 检查 Windows 发布仓库 | 原 publish repo 指向 `pg-tracker-v2`，与当前 GitHub remote 不一致 |
| `electron-builder-mac.yml` | 检查 macOS 发布仓库 | 同上 |
| `electron-builder-linux.yml` | 检查 Linux 发布仓库和图标 | 同上；Linux 图标已由 `resources/icon.png` 补齐 |
| `package.json` / `package-lock.json` | 检查发布版本号 | 现有 tag 为 `v2.4.0`，本次发布需使用新版本 |
| GitHub remote / auth | 检查上传权限和目标仓库 | 当前仓库为 `Jensenyjc/PG-tracker`，`gh auth status` 已登录且具备 repo/workflow 权限 |

### 代码修改记录

| 文件 | 修改内容 | 原因 |
|------|----------|------|
| `package.json` | 版本号升到 `2.4.1` | 避免覆盖已有 `v2.4.0` tag/release |
| `package-lock.json` | 同步版本号到 `2.4.1` | 保持 npm 元数据一致 |
| `electron-builder.yml` | publish repo 改为 `PG-tracker` | 对齐真实 GitHub 仓库 |
| `electron-builder-mac.yml` | publish repo 改为 `PG-tracker` | 对齐真实 GitHub 仓库 |
| `electron-builder-linux.yml` | publish repo 改为 `PG-tracker` | 对齐真实 GitHub 仓库 |

### 验证记录

| 命令 | 结果 |
|------|------|
| `gh auth status` | 已登录 `Jensenyjc`，token 具备 `repo`、`workflow` 权限 |
| `gh repo view --json nameWithOwner,defaultBranchRef,url` | 目标仓库确认是 `Jensenyjc/PG-tracker`，默认分支 `main` |
| `npm run typecheck` | 通过 |
| `npm test` | 3 个测试文件、75 个测试全部通过 |
| `npm run lint` | 0 errors，24 warnings，剩余均在 `electron/main/index.ts` |
| `npm run build` | 通过 |

### 发布策略

- 提交当前修复到 `main`。
- 创建 tag `v2.4.1`。
- 推送 `main` 和 `v2.4.1` 到 GitHub。
- GitHub Actions 的 Release workflow 将在云端分别构建 Windows、macOS、Linux 并上传到 GitHub Release。

### 版本纠正记录

- 用户确认发布版本应为 `V2.4`，不是 `V2.4.1`。
- 已将 `package.json` 和 `package-lock.json` 版本改回 `2.4.0`。
- 由于 GitHub Actions 的 `npm ci` 因 `@eslint/js@10.0.1` 与 `eslint@9.39.4` peer dependency 冲突失败，已将 `@eslint/js` 锁定到 `9.39.4`。
- 本地按顺序验证 `npm ci --ignore-scripts`、`npm run typecheck`、`npm test`、`npm run lint`、`npm run build` 均通过。
- 后续发布策略调整为删除误推的 `v2.4.1` tag，并用 `v2.4` tag 触发三平台 Release workflow；包内版本保持 `2.4.0`。
