# CreatorBridge 多平台内容适配发布助手

> 写一次，多平台适配 —— 帮助创作者高效适配多平台内容格式

## 参赛信息

- **参赛题目**：题目二 · 多平台内容发布工具
- **项目名称**：CreatorBridge 多平台内容适配发布助手
- **开发周期**：暑期实训营（三天限时开发）

详细测试记录见：[TEST_REPORT.md](TEST_REPORT.md)

## 项目背景

很多创作者需要在公众号、知乎、B站、小红书等平台同步发布内容，但每个平台的标题风格、正文格式、标签规则和排版习惯都不同，手动逐一适配非常耗时。

### 用户痛点

1. 同一篇内容发多个平台，需要反复修改格式。
2. 各平台对标题长度、标签数量、正文字数有不同限制。
3. 不同平台的写作风格差异大（公众号正式、小红书口语化、B站年轻化）。
4. 手动适配容易遗漏平台要求，影响发布效果。

### 解决方案与定位

CreatorBridge 提供一个"写一次，多平台适配"的内容适配工作台，在当前项目范围内可运行，主要提供内容适配与发布预演：

1. 用户只需输入一次原始内容（标题、正文、标签）。
2. 可附加本地图片/视频素材（仅支持本地预览验证，不上传本体）。
3. 系统自动生成适配公众号、知乎、B站、小红书、微博五个平台的发布版本。
4. 每个平台内容体现明显的风格差异。
5. 支持多级格式检查、工作台 Tab 独立预览、一键复制和模拟发布。
6. 提供标准 JSON 发布包导出能力，便于后续由用户自建后端处理发布任务。

## 核心功能与状态

| 功能 | 说明 | 状态 |
|------|------|------|
| 内容输入 | 标题、正文、标签、素材备注，支持字数及阅读时长统计 | 已完成 |
| 平台选择 | 公众号、知乎、B站、小红书、微博（复选框控制是否加入发布） | 已完成 |
| 本地素材管理 | 支持本地图片、视频选择及元数据读取，支持本地预览，不上传文件本体 | 已完成 |
| 一键适配 | 自动生成各平台的适配版本并触发校验 | 已完成 |
| 格式检查 | error / warning / info / success 多级提示及平台专属校验 | 已完成 |
| 多平台预览 | 中栏采用 Tab 标签页动态切换各平台预览 | 已完成 |
| 一键复制 | 复制单个平台的适配内容及排版提示 | 已完成 |
| 任务队列与发布 | 支持 Mock 队列和可选 Connector 投递，呈现独立状态流转及失败重试 | 已完成 |
| 草稿与发布历史 | localStorage 保存草稿与任务批次结果 | 已完成 |
| Payload 导出 | 一键导出标准 JSON 发布载荷文件，含验证状态和素材元数据 | 已完成 |

## 技术栈与依赖说明

| 技术 | 用途 |
| :--- | :--- |
| HTML | 页面结构 |
| CSS | 暗色主题样式、三栏网格布局、响应式设计 |
| JavaScript | 核心逻辑、多平台适配算法、DOM 操作 |
| localStorage | 草稿保存、发布历史持久化 |
| Clipboard API | 一键复制功能 |
| Blob API | 导出 JSON Payload 文件 |
| **Electron** (可选依赖) | 桌面端应用外壳封装支持 |
| **Electron Builder** (可选依赖) | 客户端打包为免安装 `.exe` 桌面程序 |
| **Electron Packager** (可选依赖) | 桌面端打包工具预留，当前默认构建命令未调用 |

### 💡 依赖与独立开发说明

* **依赖说明**：网页端无 npm 运行依赖，可直接打开 index.html 使用；桌面端为可选能力，若使用 Electron 启动或打包，需要执行 npm install 安装 package.json 中声明并已通过 npm audit 检查的 Electron 相关依赖。
* **独立开发说明**：本项目核心功能为独立设计与实现，未套用任何第三方前/后端业务模板：
  1. **多平台适配生成算法** (`src/js/adapters.js`)：针对不同平台的排版与风格进行专属设计与实现。
  2. **多级格式校验规则引擎** (`src/js/validator.js`)：支持 error、warning、info 等多层级安全校验逻辑。
  3. **发布调度与存储闭环** (`src/js/publisher.js` & `src/js/storage.js`)：独立编写的批次号生成与本地发布历史追溯。
  4. **前端响应式暗色工作台** (`src/css/style.css`)：使用 Vanilla CSS 实现三栏 Dashboard UI。

## 项目结构

```text
CreatorBridge/
├─ src/
├─ .gitignore
├─ AGENTS.md
├─ index.html
├─ package.json
├─ package-lock.json
├─ README.md
└─ TEST_REPORT.md
```

`src/` 中包含页面样式、JavaScript 模块和可选 Electron 外壳。`dist/`、`node_modules/`、本地 Agent 配置和临时文件不会提交到仓库。

---

## 发布边界与工作流模式

系统采用前端不持久化敏感凭证的设计，目前包含三种工作流：

### 1. Mock 模拟发布工作流
* **模式定义**：在本地运行的纯模拟演练流程，帮助创作者确认最终发布效果。
* **业务行为**：点击“模拟发布”后，系统会根据选中的平台生成对应的发布任务，并加入右侧控制台的发布任务队列。系统会模拟并可视化展示“待执行、发布中、成功”的状态流转，完整批次写入 `localStorage` 历史记录。失败与重试用于 Connector 联调场景。
* **网络请求**：完全本地执行，不发起真实外网请求。

### 2. Payload 载荷导出工作流
* **模式定义**：面向自建后端中转服务的标准协议导出。
* **业务行为**：完成“一键适配”后，系统会将多平台适配结果、格式校验状态及本地素材元数据打包为标准 `PublishPayload`。
* **扩展说明**：
  1. 用户可以点击右上角的“下载发布包”，将 JSON 载荷导出到本地。
  2. 创作者可以将此 JSON 提供给自建的 Node.js/Python 中转服务继续处理。
  3. 导出的 JSON 不包含 Runtime Token、Cookie 或平台 AppSecret。

### 3. Connector 发布网关投递工作流
* **模式定义**：前端直接将 Payload 投递至您自建的自定义网络后端。
* **业务行为**：用户可在右上角“⚙️ 设置”中开启发布网关模式，配置 `Connector Base URL` 和本次页面会话使用的 `Runtime Token`。Runtime Token 仅保存在当前页面内存，不写入 localStorage。点击发布后，系统会通过跨域请求将 Payload 投递给配置好的目标接口。
* **职责边界**：
  1. **前端只负责投递 Payload**。
  2. 此网关设置面板不是平台开发者密钥配置中心。前端不接受、不保存任何真实社交平台的 AppID、AppSecret、Cookie 或长期 Token。
  3. 真实发布和平台密钥管理属于用户自建后端连接器的职责。各平台敏感凭证应保存在后端安全配置中。

---

## 安全说明与凭证保护规范

在多平台内容分发场景中，密钥（AppSecret、Token、Cookie）的安全性至关重要。本工具针对限时实训场景，采取了保守且符合合规要求的安全防护策略：

1. **凭证隔离设计原则**：本阶段不接受、不保存真实社交平台的 Cookie、AppSecret、账号密码或长期 Token。Connector 模式可输入本次页面会话使用的 Runtime Token，但不会将其写入 localStorage、发布历史或导出 JSON。
2. **素材隐私与数据边界**：用户选择的图片或视频素材，通过 `URL.createObjectURL` 在本地浏览器内存中临时预览。系统不会上传文件本体，也不会将文件本体转为 Base64 持久化保存。Connector 模式会将文件名、大小、类型等素材元数据随 Payload 发送到用户配置的后端。
3. **零硬编码承诺**：前端源代码中不包含任何社交平台 API 的硬编码 Key，不进行任何非官方爬虫登录，不强制写入 Cookie。
4. **推荐最佳实践**：我们倡导“**前端不留密钥**”的行业安全规范。创作者应当通过自建的后端代理中转服务（在服务端进行安全的密钥存储、请求签名与重试机制），前端只负责向该中转服务发送包含元数据的标准 Payload。

---

## 扩展更多平台的架构设计

项目采用 **PlatformAdapter（平台适配器）** 架构设计，新增平台时无需修改主流程：

```text
新增平台流程：
1. 在 platforms.js 中新增平台配置（名称、图标、限制等）
2. 在 adapters.js 中新增 adaptToNewPlatform() 函数
3. 在 validator.js 中补充平台特定校验规则
4. 主流程自动识别新平台，无需修改 main.js
```

适配器统一接口思想：

```js
const PlatformAdapter = {
  id: 'platform-id',
  name: '平台名称',
  transform(unifiedContent) { /* 转换内容 */ },
  validate(adaptedContent) { /* 校验内容 */ },
  getPreview(adaptedContent) { /* 返回预览 */ }
};
```

未来可扩展的平台包括：今日头条、Twitter、Medium 等。

---

## 用户自建后端中转服务设计思路

为了说明未来对接真实后端的设计思路，这里提供一个简易的 Node.js 中转服务器处理 Payload 的伪代码示例。

> **⚠️ 重要声明**：真实发布需要用户自建后端并获得平台授权，不在本纯前端工具涵盖范围内。

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// 微信公众号发布端点预留契约
// CreatorBridge 前端会以 POST 方式调用: POST {Connector_Base_URL}/api/publish/wechat
// 请求头会携带: Authorization: Bearer <Runtime_Token>
// 请求体会发送标准的 PublishPayload JSON 对象
app.post('/api/publish/:platformId', async (req, res) => {
  const platformId = req.params.platformId;
  const payload = req.body;
  
  // 安全校验：请在此处校验 req.headers.authorization
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ success: false, message: '未授权' });

  const targetContent = payload.targets.find(t => t.platformId === platformId);
  if (!targetContent) {
    return res.status(400).json({ success: false, message: '未找到对应平台的适配内容' });
  }
  
  try {
    // 调用各平台官方真实 API (如微信素材上传、知乎专栏等)
    // 您的真实 AppSecret/Cookie 应安全存储在此后端，绝不可在前端泄露！
    // const result = await publishToRealPlatform(targetContent);
    res.json({ success: true, message: '连接器已接收任务' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 本地运行

本项目提供**双端运行模式**，可直接作为网页版打开，也可一键启动为桌面客户端并打包为 EXE。

### 🌐 网页端运行

**方式一：直接双击运行**
* 用浏览器直接双击打开项目根目录下的 [index.html](index.html) 即可体验核心功能。

**方式二：使用本地静态服务器启动**
```bash
# 若您本地安装了 Python
python -m http.server 3000
# 然后访问 http://localhost:3000
```

### 💻 桌面客户端运行与打包（为可选能力，需 Node 环境）

**第一步：安装桌面外壳依赖**
```bash
# 在项目根目录下运行，安装 Electron 启动与打包库
npm install
```

**第二步：在本地启动桌面端运行**
```bash
# 启动客户端，独立软件窗口将自动弹出
npm start
```

**第三步：打包为免安装 `.exe` 桌面程序**
```bash
# 运行打包编译指令
npm run dist
```
* 构建成功后，项目根目录下的 `dist/` 文件夹中将生成免安装版的客户端执行程序。
* 已发布的桌面快照体验包：[CreatorBridge v1.0.0（2026-05-30 快照）](https://github.com/QieRong/CreatorBridge/releases/tag/v1.0.0)。桌面版为快照体验包，最终功能以当前仓库源码和 Web 版本为准。

---

## 使用说明

1. **输入与平台选择**：在左侧工作区填写文章标题、正文和标签，下方勾选需要发布的平台。（可随时点击右上角“保存草稿”）
2. **素材附加**：点击选择本地图片或视频，系统仅读取文件元数据并提供预览验证，严格遵循隐私保护不上传文件。
3. **一键适配与查阅**：点击“一键适配”按钮，中栏会生成各平台专属 Tab 页。点击不同 Tab，可分别审阅对应平台的排版效果、字数预估及格式校验建议。
4. **输出与发布**：
   * **方式 A (演示体验)**：点击“模拟发布”，右栏将调度任务队列，可观测全平台模拟发布状态并留存历史。
   * **方式 B (导出资料)**：点击“下载发布包”，将标准 JSON 载荷文件交给您自建的后端继续处理。
   * **方式 C (Connector 投递)**：在设置中配置用户自建网关，将 Payload 发送到该网关。CreatorBridge 前端不直接调用真实平台 API。

## 暗色控制台布局与响应式说明

本项目采用暗色控制台布局，并基于 CSS Grid 实现高对比度三栏结构。

* **1920px 超宽屏（工作台最佳体验）**：完整展开 `[ 360px 编辑侧栏 ] - [ 自适应 Tab 预览中栏 ] - [ 340px 控制台右栏 ]` 的全局鸟瞰视图。各区域拥有独立滚动条，避免整页跳跃。
* **1366px 笔记本屏**：三栏网格自适应压缩，维持不重叠的平行操作动线。
* **< 1200px 窄屏及移动设备**：智能解除高度锁定并降级为从上到下的“单列弹性流式布局”，确保操作无横向溢出和遮挡。

---

## AI 辅助说明

本项目允许使用 AI 辅助完成需求拆解、代码结构规划、部分代码生成、文档初稿整理和问题排查。项目的功能选择、代码整合、运行测试、最终提交和演示录制由本人完成。AI 生成内容经过人工检查和修改，未直接复制第三方项目代码。

## 不足与未来优化

1. 当前平台适配规则为模拟规则，未完全对齐各平台官方最新限制。
2. 内容转换为纯前端规则匹配方式，出于运行成本考虑未使用 AI 智能改写。
3. 为保障轻量化与本地安全，目前暂不支持图片裁剪、视频编码等多媒体内容处理。
4. 暂未实现定时发布、多账号凭证管理等高级系统功能。

## 演示说明

> 演示视频链接待录制完成后补充。
>
如需体验完整功能，请在支持现代 CSS Grid 规范的浏览器中打开 `index.html`。
