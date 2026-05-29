# Agent: CreatorBridge 多平台内容适配发布助手

## 1. 项目背景

本项目用于参加暑期实训营第二批作品提交，选择题目为：

**题目二：多平台内容发布工具**

题目要求：很多创作者需要在公众号、知乎、B站、小红书等平台同步发布内容，但格式适配很麻烦。请设计并实现一个工具，帮助创作者提升发布效率和便捷性。用户在工具中输入内容，可自动适配各平台格式与风格，并支持一键发布，可选模拟发布。需给出扩展更多平台的架构设计。

## 2. 项目定位

项目名称：**CreatorBridge 多平台内容适配发布助手**

项目一句话说明：

> CreatorBridge 是一个“写一次，到处发”的创作者效率工具，用户输入一份原始内容后，系统自动生成适合公众号、知乎、B站、小红书等平台的发布版本，并支持格式检查、多平台预览、一键复制、模拟发布和发布历史管理。

本项目不是单纯的文本复制工具，也不是完整的真实平台发布系统，而是一个面向限时实训场景的轻量化内容适配与模拟发布工具。

## 3. 项目核心目标

本项目优先完成以下目标：

1. 让用户只输入一次内容。
2. 自动生成不同平台的适配版本。
3. 不同平台内容要体现明显差异。
4. 支持格式检查和发布建议。
5. 支持复制各平台内容。
6. 支持模拟发布流程。
7. 支持发布历史记录。
8. 通过平台适配器架构说明后续如何扩展更多平台。
9. 保证三天内可完成、可运行、可演示、可提交。
10. 保证 commit 和 PR 分布合理，commit提交的说明必须为中文！不能最后一天一次性提交。

## 4. 重要边界

### 4.1 本项目要做

1. 原始内容输入。
2. 内容结构化处理。
3. 公众号、知乎、B站、小红书四个平台适配。
4. 多平台预览。
5. 格式检查。
6. 单平台复制。
7. 全部内容导出，可选。
8. 模拟发布。
9. 发布历史。
10. 平台适配器架构设计。
11. README、设计文档、测试报告、Demo 脚本。
12. 网页版本优先。
13. 时间允许时可加入 Electron 桌面端打包。

### 4.2 本项目不做

1. 不做真实发布接口。
2. 不对接微信公众号、知乎、B站、小红书真实 API。
3. 不要求用户填写真实账号、密码、Cookie、Token、AppSecret。
4. 不做爬虫登录。
5. 不自动登录任何平台。
6. 不上传内容到真实平台。
7. 不做真实图片裁剪和视频上传。
8. 不做 OSS 上传。
9. 不做复杂后端。
10. 不做数据库。
11. 不做登录注册。
12. 不做付费 API 调用。
13. 不依赖真实大模型 API。
14. 不把项目包装成已经支持真实发布。

## 5. 技术路线

优先技术栈：

* HTML
* CSS
* JavaScript
* localStorage
* 原生 DOM API
* Clipboard API
* Blob 下载文本文件，可选

可选技术栈：

* Electron，用于最后阶段打包 Windows 桌面端应用

不优先使用：

* Vue
* React
* Angular
* TypeScript
* Node 后端
* Express
* 数据库
* 真实平台 API
* 大模型 API
* 图片处理库
* OSS SDK
* 大型 UI 框架

除非用户明确确认，否则不要新增复杂第三方依赖。

## 6. 推荐 Skills 使用策略

### 6.1 必需能力

在 Antigravity 中优先使用或搜索以下能力：

| 能力               | 用途                                                     |
| ------------------ | -------------------------------------------------------- |
| project-planner    | 拆分三天开发计划，控制功能范围                           |
| github-research    | 搜同类项目结构、README、交互思路                         |
| web-research       | 搜官方文档和可信资料，确认技术可行性                     |
| vanilla-js-builder | 编写 HTML/CSS/JavaScript                                 |
| docs-writer        | 编写 README、design、test-report、demo-script            |
| git-pr-writer      | 生成 commit 建议和 PR 描述，commit提交的说明必须为中文！ |

### 6.2 可选能力

| 能力              | 使用条件                                 |
| ----------------- | ---------------------------------------- |
| markdown-renderer | 仅用于简单 Markdown 预览，不作为核心依赖 |
| clipboard-helper  | 原生 Clipboard API 不够用时再考虑        |
| electron-packager | 网页功能完成后再考虑                     |
| browser-testing   | 用于打开页面和检查基础交互               |

### 6.3 暂不使用能力

以下能力在本项目中暂不使用，避免三天内做不完：

| 能力                        | 不使用原因                           |
| --------------------------- | ------------------------------------ |
| web-fetch / url scraper     | URL 抓取容易涉及跨域、版权和解析失败 |
| image-processor             | 图片裁剪压缩会增加复杂度             |
| text-rewriter / LLM rewrite | 需要模型接口或额度，容易不稳定       |
| qiniu oss / oss-uploader    | 需要账号、密钥和上传配置             |
| wechat-api                  | 真实发布权限复杂                     |
| zhihu-api                   | 公开稳定发布接口不适合短期项目       |
| bilibili-api                | 真实发布需要平台权限                 |
| xiaohongshu-api             | 真实发布权限和平台限制较多           |
| scheduler / cron            | 定时发布不是 MVP 必需功能            |

## 7. 最小可交付版本 MVP

三天内必须先完成 MVP，不要先做高级功能。

MVP 包含：

1. 内容输入
   * 标题
   * 正文
   * 标签
   * 素材链接或备注
2. 平台选择
   * 公众号
   * 知乎
   * B站
   * 小红书
3. 一键适配
   * 将一份原始内容转换为四个平台版本
4. 平台预览
   * 每个平台独立卡片展示
5. 格式检查
   * error
   * warning
   * info
6. 复制功能
   * 复制单个平台内容
   * 可选复制全部平台内容
7. 模拟发布
   * 生成发布批次号
   * 生成发布时间
   * 展示平台发布状态
8. 发布历史
   * localStorage 保存
   * 查看历史
   * 清空历史
9. 文档
   * README.md
   * docs/design.md
   * docs/test-report.md
   * docs/demo-script.md

## 8. 项目文件结构

推荐结构：

```text
creator-bridge/
├─ AGENTS.md
├─ README.md
├─ index.html
├─ src/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ main.js
│     ├─ models.js
│     ├─ platforms.js
│     ├─ adapters.js
│     ├─ validator.js
│     ├─ publisher.js
│     ├─ storage.js
│     └─ utils.js
└─ docs/
   ├─ design.md
   ├─ test-report.md
   └─ demo-script.md
```

后续如果确认要打包 EXE，再增加：

```text
├─ package.json
└─ src/
   └─ electron/
      └─ main.js
```

注意：Electron 是后续加分项，不是第一阶段必做项。

## 9. 各文件职责

### index.html

负责页面结构，包括：

1. 项目标题和说明。
2. 内容输入区。
3. 平台选择区。
4. 操作按钮区。
5. 格式检查区。
6. 多平台预览区。
7. 模拟发布结果区。
8. 发布历史区。
9. 页脚说明。

### src/css/style.css

负责页面样式，包括：

1. 效率工具风格。
2. 卡片式布局。
3. 平台卡片区分。
4. error、warning、info 状态样式。
5. 按钮交互样式。
6. 响应式布局。
7. 适合录制 demo 的界面效果。

### src/js/models.js

负责数据模型，包括：

1. createUnifiedContent()
2. createAdaptedContent()
3. createPublishResult()
4. normalizeContent()

### src/js/platforms.js

负责平台配置，包括：

1. getAllPlatforms()
2. getPlatformById()
3. platformConfigs

平台包括：

* wechat：公众号
* zhihu：知乎
* bilibili：B站
* xiaohongshu：小红书

### src/js/adapters.js

负责平台内容适配，包括：

1. adaptToWechat()
2. adaptToZhihu()
3. adaptToBilibili()
4. adaptToXiaohongshu()
5. adaptContentForPlatform()
6. adaptContentForSelectedPlatforms()

### src/js/validator.js

负责校验，包括：

1. validateRawContent()
2. validateSelectedPlatforms()
3. validateAdaptedContent()
4. validateTitleLength()
5. validateBodyLength()
6. validateTagCount()
7. buildValidationMessage()

### src/js/publisher.js

负责模拟发布，包括：

1. createBatchId()
2. mockPublish()
3. publishSelectedPlatforms()
4. createPlatformPublishResult()

### src/js/storage.js

负责本地存储，包括：

1. saveDraft()
2. loadDraft()
3. savePublishHistory()
4. getPublishHistory()
5. clearPublishHistory()

### src/js/utils.js

负责通用工具函数，包括：

1. formatTime()
2. countTextLength()
3. splitTags()
4. copyToClipboard()
5. downloadTextFile()
6. truncateText()
7. escapeHTML()

### src/js/main.js

负责主流程，包括：

1. 获取页面输入。
2. 绑定按钮事件。
3. 调用模型创建函数。
4. 调用平台适配器。
5. 调用校验器。
6. 渲染预览卡片。
7. 渲染检查结果。
8. 处理复制。
9. 处理模拟发布。
10. 渲染发布历史。

## 10. 数据模型设计

### 10.1 UnifiedContent

统一内容模型用于存储用户输入的原始内容。

```js
const unifiedContent = {
  id: "content_时间戳",
  title: "原始标题",
  body: "正文内容",
  tags: ["标签1", "标签2"],
  media: [
    {
      type: "link",
      url: "",
      description: ""
    }
  ],
  metadata: {
    authorNote: "",
    createdAt: "",
    updatedAt: "",
    source: "manual-input"
  }
};
```

### 10.2 AdaptedContent

平台适配结果模型。

```js
const adaptedContent = {
  platformId: "wechat",
  platformName: "公众号",
  title: "适配后的标题",
  body: "适配后的正文",
  tags: ["关键词1", "关键词2"],
  tips: ["发布建议1", "发布建议2"],
  warnings: ["风险提示1"],
  formatType: "text-preview",
  estimatedLength: 1200,
  generatedAt: ""
};
```

### 10.3 PublishResult

模拟发布结果模型。

```js
const publishResult = {
  batchId: "PUB-20260529-001",
  title: "原始标题",
  mode: "mock",
  status: "success",
  publishedAt: "2026-05-29 20:30:00",
  platforms: [
    {
      platformId: "wechat",
      platformName: "公众号",
      status: "success",
      message: "模拟发布成功"
    }
  ]
};
```

## 11. 平台配置规则

平台限制数值只作为项目内模拟规则，不要声称完全等同真实平台官方规则。

### 公众号

配置方向：

1. 正式表达。
2. 适合长文。
3. 支持图文说明。
4. 适合分段排版。
5. 标题相对完整。

适配结果应包含：

* 正式标题
* 开头导语
* 正文分段
* 重点总结
* 关键词
* 发布建议

### 知乎

配置方向：

1. 理性分析。
2. 结构清晰。
3. 适合观点表达。
4. 支持 Markdown 风格文本。
5. 标签偏专业。

适配结果应包含：

* 问题式或观点式标题
* 一句话结论
* 分点分析
* 观点总结
* 专业标签
* 发布建议

### B站

配置方向：

1. 年轻化。
2. 适合视频简介或专栏。
3. 强调看点。
4. 有互动引导。
5. 标签偏视频内容关键词。

适配结果应包含：

* 视频/专栏标题
* 本期看点
* 简介内容
* 互动引导
* 标签建议
* 发布建议

### 小红书

配置方向：

1. 口语化。
2. 标题短。
3. 正文分段更轻。
4. 可适量 emoji。
5. 标签转为 #话题。
6. 强调种草和分享感。

适配结果应包含：

* 短标题
* 口语化正文
* emoji 点缀
* #话题标签
* 图片或封面提示
* 发布建议

## 12. 平台适配器架构

项目必须体现 PlatformAdapter 思想，但实现上使用简单 JavaScript 对象和函数，不强制 TypeScript。

适配器统一接口思想：

```js
const PlatformAdapter = {
  id: "platform-id",
  name: "平台名称",
  transform(unifiedContent) {
    // 转换内容
  },
  validate(adaptedContent) {
    // 校验内容
  },
  getPreview(adaptedContent) {
    // 返回预览结构
  }
};
```

四个平台分别实现：

1. WechatAdapter
2. ZhihuAdapter
3. BilibiliAdapter
4. XiaohongshuAdapter

新增平台流程：

1. 在 platforms.js 中新增平台配置。
2. 在 adapters.js 中新增 adaptToNewPlatform()。
3. 在 validator.js 中补充平台规则。
4. 在 main.js 中平台列表自动渲染或读取配置。
5. 不修改整体业务主流程。

## 13. 模拟发布设计

本项目只实现 MockPublisher。

模拟发布流程：

1. 用户点击“模拟发布”。
2. 系统检查是否已有适配结果。
3. 系统检查是否存在 error 级别错误。
4. 系统生成发布批次号。
5. 系统生成发布时间。
6. 系统为每个平台生成模拟发布状态。
7. 系统将结果保存到 localStorage。
8. 页面展示发布结果和历史记录。

模拟发布结果示例：

```text
发布批次：PUB-20260529-001
发布模式：模拟发布
发布时间：2026-05-29 20:30:00

公众号：模拟发布成功
知乎：模拟发布成功
B站：模拟发布成功
小红书：模拟发布成功
```

## 14. 真实发布扩展说明

README 和 design.md 中必须说明：

1. 当前版本不做真实发布。
2. 当前版本不连接真实平台接口。
3. 当前版本不保存任何真实密钥。
4. 模拟发布用于展示完整业务流程。
5. 后续真实发布应在服务端保存平台密钥。
6. 未来可新增 WechatPublisher、BilibiliPublisher、ToutiaoPublisher 等真实发布器。
7. 真实发布必须处理平台授权、内容审核、失败重试、发布状态回调等问题。

不要在界面或文档中写“已实现真实发布”。

## 15. 功能细节要求

### 15.1 内容输入

页面必须有：

1. 标题输入框。
2. 正文输入框。
3. 标签输入框。
4. 素材链接或备注输入框。

标签支持：

```text
学习,效率工具,内容创作
学习，效率工具，内容创作
学习 效率工具 内容创作
```

### 15.2 一键适配

点击“一键适配”后必须：

1. 读取用户输入。
2. 拆分标签。
3. 检查标题和正文。
4. 检查是否选择平台。
5. 生成 UnifiedContent。
6. 调用平台适配器。
7. 显示平台预览。
8. 显示格式检查结果。

### 15.3 格式检查

检查结果分为：

* error：必须修复
* warning：建议优化
* info：普通提示

至少包含：

1. 标题为空。
2. 正文为空。
3. 未选择平台。
4. 标题过长。
5. 正文过长。
6. 标签过多。
7. 标签为空提醒。
8. 小红书内容较长提醒。
9. 素材链接为空提醒，可作为 info。

### 15.4 多平台预览

每个平台卡片显示：

1. 平台名称。
2. 平台说明。
3. 适配后标题。
4. 适配后正文。
5. 标签。
6. 字数统计。
7. 发布建议。
8. 复制按钮。

### 15.5 复制功能

复制内容包含：

1. 平台名称。
2. 标题。
3. 正文。
4. 标签。
5. 发布建议。

复制成功后显示反馈。

### 15.6 导出功能，可选

时间允许时增加：

1. 导出全部平台内容为 .txt。
2. 导出模拟发布报告为 .json。

导出功能不是第一优先级。

### 15.7 发布历史

历史记录展示：

1. 批次号。
2. 标题。
3. 平台列表。
4. 发布时间。
5. 发布模式。
6. 发布状态。

支持清空历史。

## 16. UI 设计要求

整体风格：

1. 正式。
2. 清爽。
3. 像一个效率工具。
4. 不要太像课堂练习页面。
5. 不要过度花哨。

布局建议：

1. 顶部：项目名、简介、模拟发布模式说明。
2. 第一栏：内容输入。
3. 第二栏：平台选择和操作按钮。
4. 第三栏：格式检查。
5. 第四栏：多平台预览。
6. 第五栏：模拟发布结果。
7. 第六栏：发布历史。

视觉要求：

1. 使用卡片布局。
2. 主要按钮突出。
3. error、warning、info、success 有不同样式。
4. 平台卡片有平台名称标识。
5. 适合录制两分钟 demo。
6. 支持桌面端宽屏。
7. 具备基础响应式布局。

## 17. 文档要求

### 17.1 README.md

必须包含：

1. 项目名称。
2. 参赛题目。
3. 项目背景。
4. 用户痛点。
5. 解决方案。
6. 核心功能。
7. 技术栈。
8. 项目结构。
9. 本地运行方式。
10. 使用说明。
11. 平台适配规则。
12. 模拟发布说明。
13. 扩展更多平台的架构设计。
14. 测试说明。
15. 依赖说明。
16. AI 辅助说明。
17. 不足与未来优化。
18. Demo 视频链接占位。

### 17.2 docs/design.md

必须包含：

1. 需求背景。
2. 目标用户。
3. 使用场景。
4. 功能模块说明。
5. 数据流说明。
6. UnifiedContent 数据模型。
7. PlatformAdapter 架构设计。
8. MockPublisher 设计。
9. 新平台扩展流程。
10. 异常情况处理。
11. 未来真实发布扩展方案。

### 17.3 docs/test-report.md

必须包含：

1. 测试环境。
2. 测试浏览器。
3. 测试设备。
4. 测试用例表。
5. 内容输入测试。
6. 平台选择测试。
7. 一键适配测试。
8. 格式检查测试。
9. 复制功能测试。
10. 模拟发布测试。
11. 发布历史测试。
12. 异常输入测试。
13. 测试结论。

### 17.4 docs/demo-script.md

必须包含 2 分钟以内 demo 脚本。

演示顺序：

1. 展示项目首页。
2. 说明项目解决“写一次，到处发”的问题。
3. 输入一篇原始内容。
4. 选择公众号、知乎、B站、小红书。
5. 点击一键适配。
6. 展示四个平台预览差异。
7. 展示格式检查结果。
8. 复制某个平台内容。
9. 点击模拟发布。
10. 展示发布批次和发布历史。
11. 说明平台适配器架构和后续扩展能力。

## 18. Git 与 PR 规范

必须持续提交，禁止最后一天一次性导入所有代码。

推荐 commit 类型：

* init: 项目初始化
* docs: 文档更新
* feat: 新增功能
* fix: 修复问题
* style: 样式调整
* test: 测试说明
* chore: 工程配置
* commit提交的说明必须为中文！

推荐提交节奏：

第一阶段：

```text
init: create creator bridge project structure
docs: add project background and feature scope
docs: add initial design document
feat: add base page layout
```

第二阶段：

```text
feat: add unified content model
feat: add platform configuration
feat: implement platform adapters
feat: render platform preview cards
feat: add content validation rules
```

第三阶段：

```text
feat: add mock publisher
feat: save publish history with localStorage
feat: add copy actions
fix: handle empty content and no platform selected
```

第四阶段：

```text
style: improve responsive layout and preview cards
docs: add test report and demo script
docs: update README with usage and architecture
chore: prepare final submission materials
```

每个 PR 描述必须包含：

1. 本次完成内容。
2. 修改文件。
3. 测试方式。
4. 是否新增依赖。
5. AI 辅助范围。
6. 后续待完成内容。

PR 描述示例：

```text
本次 PR 完成 CreatorBridge 项目基础结构、README 初版、设计文档初版和基础页面布局。主要新增 index.html、src/css/style.css、docs/design.md 等文件，明确项目定位、功能范围和平台适配器设计思路。本次未新增第三方依赖，已在本地浏览器完成页面打开测试。AI 仅用于辅助需求拆解、代码结构规划和文档初稿整理，最终内容由本人检查和调整。
```

## 19. 调研要求

正式编码前需要做轻量调研。

### 19.1 GitHub 搜索

搜索关键词：

```text
content publishing tool
multi platform publishing tool
social media content formatter
markdown publishing tool
creator tools
electron content editor
```

只允许参考：

1. 项目结构。
2. README 写法。
3. 功能边界。
4. 交互思路。
5. 文档组织方式。

禁止复制：

1. 核心代码。
2. 样式文件。
3. 完整页面。
4. 未声明来源的实现逻辑。
5. 第三方项目文案。

### 19.2 网页搜索

优先搜索官方文档或可信资料，确认：

1. localStorage 基本用法。
2. Clipboard API 基本用法。
3. Blob 下载文本文件方式。
4. Electron 打包方式，仅在需要 EXE 时。
5. 内容工具类项目常见交互方式。

调研结论写入 README 或 docs/design.md 的“参考与调研说明”部分，注意不要写成复制来源。

## 20. AI 辅助说明

README 中必须包含 AI 辅助说明。

建议内容：

```text
本项目允许使用 AI 辅助完成需求拆解、代码结构规划、部分代码生成、文档初稿整理和问题排查。项目的功能选择、代码整合、运行测试、最终提交和演示录制由本人完成。AI 生成内容经过人工检查和修改，未直接复制第三方项目代码。
```

## 21. 安全要求

禁止在代码、文档、提交记录中出现：

1. 真实账号。
2. 密码。
3. API Key。
4. Cookie。
5. Token。
6. AppSecret。
7. 私人聊天记录。
8. 无关个人信息。
9. 第三方未授权素材。
10. 大体积无关文件。

如果需要示例密钥，只能写：

```text
YOUR_API_KEY_HERE
```

但本项目默认不需要任何密钥。

## 22. Electron 打包说明

Electron 是可选加分项，不是第一优先级。

开发顺序：

1. 先完成网页版本。
2. 确认核心功能稳定。
3. 完成 README、design、test-report、demo-script。
4. 再考虑 Electron。

加入 Electron 时必须保证：

1. 不破坏网页版本。
2. package.json 命令清晰。
3. README 说明网页运行和桌面运行两种方式。
4. 打包失败也不影响网页版本提交。

不要为了 EXE 耽误核心功能、文档和 PR 过程记录。

## 23. 最终提交检查清单

提交前必须检查：

1. 项目能正常打开。
2. 页面布局无明显错位。
3. 标题输入正常。
4. 正文输入正常。
5. 标签拆分正常。
6. 平台选择正常。
7. 一键适配正常。
8. 四个平台内容有明显差异。
9. 格式检查能显示 error、warning、info。
10. 复制功能可用。
11. 模拟发布可用。
12. 发布批次号正常生成。
13. 发布历史可保存。
14. 发布历史可清空。
15. README.md 完整。
16. docs/design.md 完整。
17. docs/test-report.md 完整。
18. docs/demo-script.md 完整。
19. 无真实密钥。
20. 无敏感信息。
21. 无未声明第三方依赖。
22. commit 记录分布合理，commit提交的说明必须为中文！
23. PR 描述不为空。
24. Demo 视频能完整展示流程。
25. 项目内容与题目二高度一致。

## 24. 与用户交互要求

每次修改代码前，先说明：

1. 本轮目标。
2. 要修改的文件。
3. 是否新增依赖。
4. 如何测试。

每次修改代码后，说明：

1. 完成内容。
2. 修改文件。
3. 运行方式。
4. 测试方式。
5. 建议 commit 信息，commit提交的说明必须为中文！

不要一次性实现全部复杂功能。
不要无理由重构。
不要删除已有可用功能。
不要生成伪代码。
不要省略关键代码。
不要让项目偏离“多平台内容适配与模拟发布工具”的主线。

24. **与用户交互要求**

    请从现在开始，所有 CreatorBridge 项目的开发任务都必须遵守以下 Git、commit 和 PR 规范。

    项目背景：
    本项目用于暑期实训营作品提交，评审要求全周期持续交付，不能最后一天一次性导入代码。所有功能必须通过 Pull Request 逐步提交，每个 PR 只做一件事，PR 描述不能为空，也不能与实际代码变更不符。

    一、开发前必须先做的事

    每次开始开发前，请先执行：

    ```bash
    git status
    ```

    然后输出：

    1. 当前分支名称。
    2. 当前工作区是否干净。
    3. 本轮准备实现的单一功能。
    4. 本轮预计修改哪些文件。
    5. 是否新增第三方依赖。
    6. 是否涉及复用历史代码。
    7. 本轮建议创建的分支名。

    如果工作区已有未提交内容，请先说明这些内容属于哪个阶段，不要直接覆盖或混合修改。

    二、每个 PR 只做一件事

    请严格遵守：

    1. 一个 PR 只实现或修改一个单一功能。
    2. 不要把 UI、数据模型、文档、测试、重构混在一个大 PR 里。
    3. 大功能必须拆成多个小 PR。
    4. 每个 PR 合并后，主分支代码必须保持可运行。
    5. 不要一次性提交大量无关文件。
    6. 不要最后一天一次性导入所有代码。
    7. 不要把临时测试文件、scratch 文件、AI 工具内部文件提交到仓库。

    三、推荐分支命名

    请按功能创建独立分支，例如：

    ```bash
    git checkout -b feat/payload-export
    git checkout -b feat/connector-preview
    git checkout -b docs/product-docs
    git checkout -b test/manual-test-report
    git checkout -b fix/publish-history
    git checkout -b style/dashboard-layout
    ```

    分支名要和本轮 PR 内容一致。

    四、commit 规范

    每次完成一个小修改后都要提交 commit，不要攒到最后一起提交。

    commit 信息推荐格式：

    ```bash
    feat: add payload export preview
    fix: handle empty platform selection
    docs: update connector mode design
    test: add manual test cases for payload export
    style: improve publisher mode layout
    refactor: keep mock publisher compatible
    ```

    如果实训营要求中文 commit，也可以使用中文，例如：

    ```bash
    feat: 新增 Payload 导出预览功能
    docs: 补充连接器模式设计说明
    test: 新增 Payload 导出手动测试用例
    fix: 修复未选择平台时的提示逻辑
    ```

    禁止：

    1. 使用空泛 commit，例如 `update`、`fix bug`、`修改一下`。
    2. 使用和实际修改不符的 commit。
    3. 修改旧 commit 时间戳。
    4. 使用 amend/rebase 改写已提交记录，除非我明确要求。
    5. 在所选批次时间之外制造提交记录。

    五、PR 创建规范

    每完成一个阶段的小功能后，请创建或准备一个 PR。

    如果你有权限直接创建 PR，请创建 PR。
    如果你没有权限，请输出完整 PR 标题和描述，让我手动创建。

    PR 标题格式：

    ```text
    feat: 新增 Payload JSON 导出功能
    docs: 补充连接器模式安全说明
    style: 重设计发布模式选择区域
    test: 补充核心流程手动测试用例
    ```

    六、PR 描述必须包含以下内容

    每个 PR 描述必须完整包含：

    ```markdown
    ## 功能描述
    
    说明本 PR 新增或修改了什么功能，以及用户如何使用。
    
    ## 实现思路
    
    说明核心实现逻辑、技术选型、数据流或模块拆分。
    
    ## 修改文件
    
    列出本 PR 修改的主要文件，并说明每个文件的作用。
    
    ## 测试方式
    
    说明如何验证功能可用，例如：
    1. 打开 index.html
    2. 输入标题和正文
    3. 选择平台
    4. 点击一键适配
    5. 点击导出 Payload JSON
    6. 检查控制台是否有报错
    
    ## 是否新增依赖
    
    说明是否新增第三方库或框架。
    
    如果没有新增，请写：
    本 PR 未新增第三方依赖。
    
    如果新增了，必须写：
    1. 依赖名称
    2. 用途
    3. 为什么需要
    4. 是否已在 README 中说明
    
    ## 原创与复用说明
    
    说明本 PR 是否复用了过去代码或第三方代码。
    
    如果没有复用，请写：
    本 PR 未复用本人过去代码片段，未复制第三方项目代码。
    
    如果有复用，必须写明：
    1. 来源
    2. 复用范围
    3. 修改内容
    4. 为什么需要复用
    
    ## AI 辅助说明
    
    说明 AI 参与范围，例如：
    AI 用于辅助需求拆解、代码结构建议、文档初稿整理和问题排查。最终功能选择、代码整合、测试和提交由本人完成。
    
    ## 风险与后续工作
    
    说明本 PR 的边界和后续计划。
    ```

    七、合规要求

    必须满足：

    1. 作品符合题目二“多平台内容发布工具”方向。
    2. 不做与题目无关的功能。
    3. 不抄袭第三方项目。
    4. 不复制第三方项目核心代码。
    5. 引用第三方库必须在 README 中列明依赖。
    6. 复用自己过去代码必须在 PR 描述中注明来源。
    7. PR 描述不能为空。
    8. PR 描述必须与实际代码变更一致。
    9. 每个 PR 合并后，项目仍可打开和演示。
    10. 每次开发都要有合理 commit 记录，不能临尾突击提交。

    八、每轮开发结束后必须输出

    每轮完成后，请输出：

    1. 本轮完成内容。
    2. 修改文件。
    3. 是否新增依赖。
    4. 是否复用旧代码。
    5. 执行了哪些测试。
    6. 测试结果。
    7. git status 摘要。
    8. git diff --stat 摘要。
    9. 建议 commit 信息。
    10. PR 标题。
    11. 完整 PR 描述。
    12. 下一轮建议。

    九、如果无法直接创建 PR

    如果当前环境无法连接 GitHub、无法 push、无法创建 PR，请不要假装已经创建。

    请改为输出：

    1. 需要我手动执行的 git 命令。
    2. 建议分支名。
    3. 建议 commit 信息。
    4. 建议 PR 标题。
    5. 完整 PR 描述。
    6. 手动创建 PR 的注意事项。

    十、主分支可运行要求

    每个 PR 合并后，main 分支必须保持可运行。

    每次提交前至少检查：

    1. index.html 能打开。
    2. 一键适配功能可用。
    3. 模拟发布功能可用。
    4. 发布历史功能可用。
    5. 控制台无明显 JavaScript 报错。
    6. 如果修改文档，文档内容与当前功能一致。
    7. 如果新增依赖，README 已说明。
