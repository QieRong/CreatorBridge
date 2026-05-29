# CreatorBridge 多平台内容适配发布助手

> 写一次，到处发 —— 帮助创作者高效适配多平台内容格式

## 📋 参赛信息

- **参赛题目**：题目二 · 多平台内容发布工具
- **项目名称**：CreatorBridge 多平台内容适配发布助手
- **开发周期**：暑期实训营（三天限时开发）

## 📖 项目背景

很多创作者需要在公众号、知乎、B站、小红书等平台同步发布内容，但每个平台的标题风格、正文格式、标签规则和排版习惯都不同，手动逐一适配非常耗时。

### 用户痛点

1. 同一篇内容发多个平台，需要反复修改格式。
2. 各平台对标题长度、标签数量、正文字数有不同限制。
3. 不同平台的写作风格差异大（公众号正式、小红书口语化、B站年轻化）。
4. 手动适配容易遗漏平台要求，影响发布效果。

### 解决方案与定位

CreatorBridge 提供一个"写一次，到处发"的效率工具，在当前项目范围内可运行，主要提供内容适配与模拟发布验证：

1. 用户只需输入一次原始内容（标题、正文、标签、素材备注）。
2. 系统自动生成适配公众号、知乎、B站、小红书四个平台的发布版本。
3. 每个平台内容体现明显的风格差异。
4. 支持格式检查、多平台预览、一键复制和模拟发布。
5. **预留连接器架构**，支持作为后续扩展真实发布的基础，便于创作者以后自建后端中转服务，从而规避前端直接存储密钥的泄露风险。

## ✨ 核心功能与状态

| 功能 | 说明 | 状态 |
|------|------|------|
| 内容输入 | 标题、正文、标签、素材备注 | 已完成 |
| 平台选择 | 公众号、知乎、B站、小红书 | 已完成 |
| 一键适配 | 自动生成四个平台的适配版本 | 已完成 |
| 格式检查 | error / warning / info 三级提示 | 已完成 |
| 多平台预览 | 每个平台独立卡片展示 | 已完成 |
| 一键复制 | 复制单个平台的适配内容 | 已完成 |
| 模拟发布 | 生成发布批次号、平台发布状态和发布时间 | 已完成 |
| 发布历史 | localStorage 保存模拟发布历史记录 | 已完成 |
| 接口预留配置 | 支持中转 API 地址、鉴权方式及端点配置 | 计划实现（本阶段设计预留） |
| Payload 导出 | 导出标准的 PublishPayload JSON 载荷文件 | 计划实现（本阶段设计预留） |

## 🛠️ 技术栈与依赖说明

| 技术 | 用途 |
|------|------|
| HTML | 页面结构 |
| CSS | 页面样式、卡片布局、响应式设计 |
| JavaScript | 核心逻辑、多平台适配算法、DOM 操作 |
| localStorage | 草稿保存、发布历史持久化 |
| Clipboard API | 一键复制功能 |
| Blob API | 导出 JSON Payload 文件（计划实现） |
| **Electron** (可选依赖) | 桌面端应用外壳封装支持 |
| **Electron Builder** (可选依赖) | 客户端打包为免安装 `.exe` 桌面程序 |

### 💡 依赖与独立开发说明

* **依赖说明**：网页端无 npm 运行依赖，可直接打开 index.html 使用；桌面端为可选能力，若使用 Electron 启动或打包，需要执行 npm install 安装 package.json 中声明的 Electron 相关依赖。本阶段未新增依赖。
* **独立开发说明**：本项目核心功能为独立设计与实现，未套用任何第三方前/后端业务模板：
  1. **多平台适配生成算法** (`src/js/adapters.js`)：针对公众号、知乎、B站、小红书的排版与风格进行专属设计与实现。
  2. **多级格式校验规则引擎** (`src/js/validator.js`)：支持 error、warning、info 的多层级安全校验逻辑。
  3. **发布调度与存储闭环** (`src/js/publisher.js` & `src/js/storage.js`)：独立编写的批次号生成与本地发布历史追溯。
  4. **前端响应式卡片样式** (`src/css/style.css`)：纯 Vanilla CSS 从零实现。

---

## 🚦 发布模式说明

本系统在架构上设计了三种发布模式，以支持创作者从模拟演示到未来对接真实发布的过渡：

### 1. Mock 模拟发布模式（当前默认支持）
* **模式定义**：完全在本地运行的模拟发布验证模式。
* **业务行为**：点击发布后，系统会直接验证内容完整性，生成批次号（PUB-YYYYMMDD-XXX）及发布时间，并在页面上呈现各平台的模拟发布状态，同时写入本地 localStorage 发布历史中，便于创作者演示完整流程。
* **网络请求**：不发起任何网络请求。

### 2. Connector 自定义连接器模式（计划实现/设计预留）
* **模式定义**：面向架构扩展的“接口预留型”真实发布中转模式。
* **业务行为**：用户开启此模式后，可以配置自己的中转 API Base URL、鉴权方式（如 Bearer Token / 自定义 Header）以及各平台端点。当点击发布时，系统将适配后的多平台内容组装成标准的 `PublishPayload` 统一载荷，通过 `fetch POST` 发送到用户自建的后端接口。
* **扩展说明**：当前提供自定义连接器配置入口与接口调度预留，**本系统不内置各社交平台官方真实发布接口，亦不包含具体第三方真实发送实现**。真实的发布能力完全取决于用户自己后端的实现、目标平台的接口权限以及账号审核状态。如果用户没有配置后端服务，直接点击真实发布按钮将提示“当前未配置连接器，已自动使用模拟发布”。

### 3. Payload JSON 导出模式（计划实现/设计预留）
* **模式定义**：仅生成和导出发布载荷的纯前端模式。
* **业务行为**：用户点击发布后，系统将统一的 `PublishPayload` 转换为标准的 JSON 文本，并触发浏览器下载名为 `publishPayload.json` 的文件。创作者可将此文件导入到自有的内容管理系统中进行分发。

---

## 🔒 安全说明与凭证保护规范

在多平台内容分发场景中，密钥（AppSecret、Token、Cookie）的安全性至关重要。本工具针对限时实训场景，采取了保守且符合合规要求的安全防护策略：

1. **凭证零持久化原则**：用户临时填写的自定义中转 Token **默认仅保存在浏览器运行时的内存变量中**，页面一旦关闭或刷新即刻销毁，**坚决不写入 localStorage 或任何客户端本地持久化存储**，也绝不提交至 Git 仓库。
2. **非敏感配置隔离保存**：如果用户选择保存配置，localStorage 仅会持久化保存 API Base URL、鉴权类型（authType）以及平台映射路径（platformMapping）等非敏感参数，而 Token 框将保持为空，杜绝在公共设备上长期残留凭证的风险。
3. **明密文脱敏保护（计划实现）**：界面上的 Token 输入框计划采用密码属性，默认以点状密文显示，并提供小眼睛切换图标供创作者进行临时可见度确认，防止在录制视频或多人屏幕共享时发生意外泄露。
4. **零硬编码承诺**：前端源代码中不包含任何平台 API 的硬编码 Key，不进行任何非官方爬虫登录，不强制写入 Cookie。
5. **推荐最佳实践**：我们倡导“**前端不留密钥**”的行业安全规范。创作者应当通过自建的后端代理中转服务（在服务端进行安全的密钥存储、请求签名与重试机制），前端只负责向该中转服务发送标准 Payload。不要在前端保存或硬编码任何 AppSecret、Cookie 或真实 Token。

---

## 🏗️ 扩展更多平台的架构设计

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

未来可扩展的平台包括：今日头条、微博、Twitter、Medium 等。

---

## 💻 用户自建后端中转服务设计思路

为了说明未来后端中转服务的设计思路，这里提供一个简易的 Node.js (Express) 后端中转服务器示例。

> **⚠️ 重要声明**：以下示例仅用于说明未来后端中转服务的设计思路，不属于当前前端项目运行必需代码，也不是当前版本已内置的真实发布服务。真实发布需要用户自建后端并获得平台授权，不属于当前前端内置能力。

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // 允许跨域（本地开发调试必需）
app.use(express.json());

// 鉴权中间件示例
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer YOUR_MEMBERSHIP_TOKEN') {
    return res.status(401).json({ success: false, message: '凭证无效' });
  }
  next();
};

// 微信公众号发布端点预留
app.post('/api/publish/wechat', authenticate, async (req, res) => {
  const payload = req.body;
  
  // 1. 从 payload.targets 中提取 platformId: "wechat" 的内容
  const wechatContent = payload.targets.find(t => t.platformId === 'wechat');
  if (!wechatContent) {
    return res.status(400).json({ success: false, message: '未找到微信适配内容' });
  }
  
  try {
    // 2. 调用微信官方 API 上传草稿箱或直接发布（在此处安全注入您存储在服务端的 AppSecret）
    // const result = await uploadToWechatDraft(wechatContent.title, wechatContent.body);
    
    // 3. 返回发布结果
    res.json({
      success: true,
      platformId: 'wechat',
      message: '成功导入微信草稿箱',
      externalUrl: 'https://mp.weixin.qq.com/...' // 可选的真实链接
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 其他平台端点同理：/api/publish/zhihu, /api/publish/bilibili, /api/publish/xiaohongshu

app.listen(3000, () => {
  console.log('中转服务已启动：http://localhost:3000');
});
```

---

## 🚀 本地运行

本项目提供**双端运行模式**，可直接作为网页版打开，也可一键启动为桌面客户端并打包为 EXE。

### 🌐 网页端运行

**方式一：直接双击运行**
* 用浏览器直接双击打开项目根目录下的 [index.html](index.html) 即可体验核心功能。

**方式二：使用本地静态服务器启动**
```bash
# 若您本地安装了 Python
python -m http.server 8080

# 若您本地安装了 Node.js
npx serve .

# 然后访问 http://localhost:8080
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
* 构建成功后，项目根目录下的 `dist/` 文件夹中将生成免安装版的 `CreatorBridge Setup 1.0.0.exe` 以及绿色解压即开版。

## 📝 使用说明

1. 在输入区填写文章标题、正文、标签和素材备注。
2. 在平台选择区勾选需要适配的平台（公众号、知乎、B站、小红书）。
3. 点击「一键适配」按钮，系统自动生成各平台的适配版本。
4. 在预览区查看各平台内容差异，确认格式检查结果。
5. 点击「复制」按钮复制单个平台的内容。
6. 点击「模拟发布」生成发布历史记录。
7. （设计预留）后续支持在配置面板切换为“自定义连接器”或“仅生成 Payload”并配置自备 API 调试发布。

## 🧪 测试与依赖说明

* 详见 [docs/test-report.md](docs/test-report.md) 和 [docs/design.md](docs/design.md)。
* 本项目网页端无 npm 运行依赖，可直接打开 index.html 使用；桌面端为可选能力，若使用 Electron 启动或打包，需要执行 npm install 安装 package.json 中声明的 Electron 相关依赖。本阶段未新增依赖。
* 外部资源：Google Fonts（Inter 和 Noto Sans SC 字体，仅用于界面渲染美化，非必需）。

## 🤖 AI 辅助说明

本项目允许使用 AI 辅助完成需求拆解、代码结构规划、部分代码生成、文档初稿整理和问题排查。项目的功能选择、代码整合、运行测试、最终提交和演示录制由本人完成。AI 生成内容经过人工检查和修改，未直接复制第三方项目代码。

## ⚠️ 不足与未来优化

1. 当前平台适配规则为模拟规则，未完全对齐各平台官方最新限制。
2. 内容转换为规则匹配方式，未使用 AI 智能改写。
3. 不支持图片裁剪、视频处理等多媒体内容适配。
4. 暂未实现定时发布、多账号管理等高级功能。

## 🎬 Demo 视频

> 视频链接待录制完成后补充

演示脚本详见 [docs/demo-script.md](docs/demo-script.md)。
