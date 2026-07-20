# CreatorBridge 测试报告

## 1. 测试范围

本报告覆盖内容输入、多平台适配、AI 智能适配、格式检查、Payload 导出、Mock 队列、Connector 配置、发布历史和敏感信息边界。

## 2. 测试环境

* 操作系统：Windows
* 网页版本：可直接打开 `index.html`，也可使用本地静态服务器
* JavaScript 语法检查：Node.js `node --check`
* 本轮 Node.js 版本：v24.15.0
* Connector 联调说明：仓库不包含后端连接器。联调时需要用户自行准备支持 `GET /health` 与 `POST /api/publish/:platformId` 的本地服务。

## 3. 自动化与静态检查

| 检查项 | 检查方式 | 结果 |
| --- | --- | --- |
| JavaScript 语法 | 对 `src/js/*.js` 执行 `node --check` | 通过 |
| Git 空白错误 | 执行 `git diff --check` | 通过 |
| npm 依赖审计 | 执行 `npm audit --audit-level=high --package-lock-only` | 通过，未发现漏洞 |
| 五个平台适配 | 使用本地临时回归脚本加载模块并生成适配结果 | 通过 |
| 标签拆分 | 验证英文逗号、中文逗号和空格分隔 | 通过 |
| 空输入校验 | 验证标题、正文、平台为空时产生阻断错误 | 通过 |
| Connector 历史模式 | 验证 Connector 失败任务记录为 `connector` / `failed` | 通过 |
| 旧 Payload 失效 | 审查输入、标签、平台和素材变化后的失效调用 | 通过 |
| 发布器重复定义 | 验证各发布器只定义一次 | 通过 |

### 3.1 本轮 AI 智能适配实际验证（2026-07-20）

| 检查项 | 检查方式 | 结果 |
| --- | --- | --- |
| 安全截断与 AI 返回规整 | `npm test` 中的 `ai-utils.test.js` | 通过：3 项测试 |
| 前端 AI 成功与回退分支 | `npm test` 中的 `ai-client.test.js` | 通过：2 项测试 |
| OpenRouter 代理成功响应 | 以模拟 OpenRouter 响应运行 `server.test.js` | 通过：验证 `{ targets }` 合法返回 |
| 超长输入拦截 | `server.test.js` 使用 12001 字正文 | 通过：返回 400，未调用上游 |
| 非法 JSON 与超时 | `server.test.js` 注入非法响应与 `AbortError` | 通过：分别返回 502、504 |
| 未配置 Key 的服务端路径 | 启动 `npm run dev` 后 POST `/api/ai-adapt` | 通过：首页 HTTP 200，接口 HTTP 503；前端会据此回退本地规则 |
| AI 真实成功调用 | 需要有效 OpenRouter Key、NVIDIA 模型 ID 与可用额度 | 未实测：本仓库不包含真实凭证 |
| 浏览器视觉验收 | Playwright CLI 页面快照 | 未完成：首次下载浏览器工具超时，未将其表述为已通过 |
| 生产依赖高危审计 | `npm audit --omit=dev --audit-level=high` | 通过：0 个高危漏洞 |

## 4. 提交前手动验收清单

以下项目需要在录制 Demo 前使用 Chrome 或 Edge 完成一次手动复验：

| 模块 | 操作步骤 | 预期结果 |
| --- | --- | --- |
| 内容输入 | 填写标题、正文和标签 | 字数统计更新，一键适配按钮可用 |
| 平台适配 | 勾选五个平台并点击“一键适配” | 生成不同平台的 Tab 和差异化内容 |
| 格式检查 | 使用空标题、空正文或超长小红书内容 | 显示对应 error、warning 或 info |
| 本地素材 | 选择图片或视频 | 使用对象 URL 本地预览，不上传文件本体 |
| 复制 | 点击单平台复制和 Payload 复制 | 剪贴板获得对应文本 |
| Mock 队列 | 未开启 Connector 时点击“模拟发布” | 展示本地任务状态流转并写入历史 |
| 历史记录 | 刷新页面后查看历史，再点击清空 | 历史可恢复，也可清空 |
| Connector 探活 | 配置自建网关并点击“测试连接” | 请求 `GET /health`，按响应展示结果 |
| Connector 投递 | 配置自建网关并点击发布 | 向 `POST /api/publish/:platformId` 发送 Payload |
| Connector 失败 | 停止自建网关后重试 | 任务显示失败，可触发单任务重试 |
| AI 智能适配成功 | 在 `.env` 配置有效 OpenRouter Key 与 NVIDIA 模型，选择“智能适配” | 返回五个平台语义改写结果，继续显示现有格式校验与 Tab 预览 |
| AI 服务未启动 | 直接打开 `index.html` 或停止 `npm run dev` 后选择“智能适配” | 显示“AI适配失败，已切换为本地规则适配”，并生成规则适配结果 |
| AI 返回异常 | 使用无额度 Key、故意错误模型 ID 或服务端模拟非 JSON 响应 | 自动回退本地规则，不影响复制、Payload 导出和 Mock 发布 |

## 5. 安全与隐私边界

| 检查项 | 检查方式 | 结果 |
| --- | --- | --- |
| Runtime Token 不写入 localStorage | 审查 `storage.js` | 通过 |
| Runtime Token 不写入导出 JSON | 审查 Payload 构造逻辑 | 通过 |
| Runtime Token 不写入发布历史 | 审查历史记录字段 | 通过 |
| 前端不保存平台 AppSecret、Cookie 等 | 审查 UI 与存储逻辑 | 通过 |
| 图片 / 视频文件本体不上传 | 审查 `URL.createObjectURL` 本地预览逻辑 | 通过 |
| Connector 会发送素材元数据 | 审查 Payload 与请求体 | 已明确说明 |
| OpenRouter Key 不进入前端 | 审查 `.env.example`、`server.js`、前端请求体和 `.gitignore` | 通过：Key 仅由服务端环境变量读取 |
| AI 请求不记录完整正文 | 审查 `server.js` | 通过：服务端未输出正文或 Key 到日志 |

## 6. 发布边界说明

* **Mock 模式**：仅用于本地模拟任务流转，不向真实平台发送请求。
* **Payload 导出**：导出 JSON 文件，不包含 Runtime Token。
* **Connector 模式**：将标准 Payload 和素材元数据投递到用户配置的自建后端网关。
* **真实平台发布**：不属于 CreatorBridge 前端能力，需要由用户自建后端处理平台授权、平台 API 调用、素材上传和状态回传。

## 7. 当前结论

当前版本具备快速规则适配和 AI 语义适配 MVP、格式检查、Mock 队列、Payload 导出和 Connector 投递入口。AI 成功路径的单元级代理验证已完成；真实模型调用与浏览器视觉验收尚需在拥有有效 OpenRouter 凭证的环境中按第 4 节完成，不应将其表述为已实测。
