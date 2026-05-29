# CreatorBridge 系统设计文档

## 1. 需求背景

### 1.1 题目要求

暑期实训营题目二：多平台内容发布工具。

很多创作者需要在公众号、知乎、B站、小红书等平台同步发布内容，但格式适配很麻烦。需要设计并实现一个工具，帮助创作者提升发布效率和便捷性。

### 1.2 核心问题

1. 不同平台的标题、正文、标签格式要求各不相同。
2. 手动为每个平台修改内容耗时且容易遗漏。
3. 缺乏统一的预览和检查机制。
4. 发布记录分散在各平台，难以统一管理。

## 2. 目标用户

| 用户角色 | 使用场景 | 核心需求 |
|----------|----------|----------|
| 自媒体创作者 | 多平台同步发布文章 | 一次输入，多平台输出 |
| 技术博主 | 在知乎、公众号同步发技术文 | 格式自动适配 |
| 视频UP主 | 在B站发视频简介、小红书发笔记 | 快速生成不同风格文案 |
| 内容运营 | 批量管理多平台发布任务 | 发布历史和状态管理 |

## 3. 使用场景

### 场景一：博主写一篇技术文

1. 在 CreatorBridge 输入原始文章。
2. 选择公众号、知乎、B站。
3. 一键适配，获得三个平台版本。
4. 检查格式，复制到各平台发布。

### 场景二：UP主发一期视频

1. 输入视频主题和看点。
2. 选择B站和小红书。
3. B站生成视频简介（含互动引导），小红书生成种草笔记。
4. 模拟发布，确认内容无误后复制。

## 4. 功能模块说明

```text
┌─────────────────────────────────────┐
│           CreatorBridge             │
├──────────┬──────────┬───────────────┤
│  输入层  │  处理层   │    展示层     │
├──────────┼──────────┼───────────────┤
│ 标题输入 │ 数据模型  │  平台预览     │
│ 正文输入 │ 平台配置  │  格式检查     │
│ 标签输入 │ 内容适配  │  发布结果     │
│ 素材备注 │ 格式校验  │  发布历史     │
│ 平台选择 │ 模拟发布  │  Toast通知    │
│          │ 本地存储  │              │
└──────────┴──────────┴───────────────┘
```

### 4.1 输入层

- **内容输入**：标题、正文、标签、素材链接/备注
- **平台选择**：公众号、知乎、B站、小红书（可多选）

### 4.2 处理层

- **数据模型** (models.js)：统一内容模型的创建和规范化
- **平台配置** (platforms.js)：各平台参数（名称、限制、颜色等）
- **内容适配** (adapters.js)：将统一内容转换为各平台专属格式
- **格式校验** (validator.js)：检查内容是否符合平台要求
- **模拟发布** (publisher.js)：生成发布批次号和模拟状态
- **本地存储** (storage.js)：草稿和发布历史的持久化

### 4.3 展示层

- **平台预览**：每个平台独立卡片，展示适配后内容
- **格式检查**：error / warning / info 三级提示
- **发布结果**：发布批次号、各平台状态
- **发布历史**：历史记录列表
- **Toast通知**：操作反馈提示

## 5. 数据流说明

```text
用户输入 → UnifiedContent → PlatformAdapter → AdaptedContent → 预览/复制
                                    ↓
                              Validator → 校验结果 → 格式检查展示
                                    ↓
                            MockPublisher → PublishResult → 发布历史
                                    ↓
                              Storage → localStorage
```

### 流程描述

1. 用户填写标题、正文、标签，选择目标平台。
2. 点击「一键适配」，系统创建 UnifiedContent（统一内容模型）。
3. 系统调用各平台的 Adapter，将 UnifiedContent 转换为 AdaptedContent。
4. 同时调用 Validator 进行格式校验，生成检查结果。
5. 页面渲染预览卡片和校验消息。
6. 用户可复制单个平台内容，或点击「模拟发布」。
7. MockPublisher 生成发布批次号和各平台发布状态。
8. Storage 将发布结果保存到 localStorage。

## 6. UnifiedContent 数据模型

统一内容模型是整个系统的核心数据结构，用于存储用户输入的原始内容。

```js
const unifiedContent = {
  id: 'content_时间戳',         // 唯一ID
  title: '原始标题',            // 用户输入的标题
  body: '正文内容',             // 用户输入的正文
  tags: ['标签1', '标签2'],     // 拆分后的标签数组
  media: [{                     // 素材信息（可选）
    type: 'link',
    url: '',
    description: ''
  }],
  metadata: {                   // 元数据
    authorNote: '',
    createdAt: '',
    updatedAt: '',
    source: 'manual-input'
  }
};
```

## 7. PlatformAdapter 架构设计

### 7.1 设计思想

采用适配器模式（Adapter Pattern），每个平台实现一个独立的适配器。适配器负责将 UnifiedContent 转换为该平台专属的 AdaptedContent。

```js
// 适配器统一接口
const PlatformAdapter = {
  id: 'platform-id',
  name: '平台名称',
  transform(unifiedContent) {
    // 将统一内容转换为平台格式
    return adaptedContent;
  },
  validate(adaptedContent) {
    // 校验适配后内容是否符合平台要求
    return validationMessages;
  },
  getPreview(adaptedContent) {
    // 返回预览结构
    return previewData;
  }
};
```

### 7.2 当前实现的适配器

| 适配器 | 平台 | 风格特征 |
|--------|------|----------|
| WechatAdapter | 微信公众号 | 正式权威，导语+分段+总结 |
| ZhihuAdapter | 知乎 | 理性分析，问题式标题+分点论证 |
| BilibiliAdapter | B站 | 年轻化，吸睛标题+互动引导 |
| XiaohongshuAdapter | 小红书 | 口语种草，短标题+emoji+话题 |

### 7.3 适配器注册表

```js
// 适配器通过注册表管理，新增平台只需注册即可
const adapterMap = {
  wechat: adaptToWechat,
  zhihu: adaptToZhihu,
  bilibili: adaptToBilibili,
  xiaohongshu: adaptToXiaohongshu
  // 新增平台在此注册
};
```

## 8. MockPublisher 设计

### 8.1 发布流程

```text
1. 用户点击「模拟发布」
2. 系统检查是否已有适配结果
3. 系统检查是否存在 error 级别错误
4. 系统生成发布批次号（格式：PUB-YYYYMMDD-XXX）
5. 系统生成发布时间
6. 系统为每个平台生成模拟发布状态
7. 系统将结果保存到 localStorage
8. 页面展示发布结果和历史记录
```

### 8.2 PublishResult 数据模型

```js
const publishResult = {
  batchId: 'PUB-20260529-001',
  title: '原始标题',
  mode: 'mock',
  status: 'success',
  publishedAt: '2026-05-29 20:30:00',
  platforms: [
    {
      platformId: 'wechat',
      platformName: '公众号',
      status: 'success',
      message: '模拟发布成功'
    }
  ]
};
```

### 8.3 重要声明

- 当前版本不做真实发布。
- 不连接真实平台接口。
- 不保存任何真实密钥。
- 模拟发布用于展示完整业务流程。

## 9. 新平台扩展流程

如需新增一个平台（如今日头条），只需以下步骤：

### 步骤一：新增平台配置

在 `platforms.js` 中添加：

```js
{
  id: 'toutiao',
  name: '今日头条',
  icon: '📰',
  description: '适合新闻资讯、图文内容',
  maxTitleLength: 30,
  maxBodyLength: 5000,
  maxTags: 5,
  color: '#FF0000'
}
```

### 步骤二：新增适配函数

在 `adapters.js` 中添加：

```js
function adaptToToutiao(unified) {
  // 今日头条的内容转换逻辑
  return Models.createAdaptedContent(...);
}

// 注册到适配器表
adapterMap.toutiao = adaptToToutiao;
```

### 步骤三：补充校验规则

在 `validator.js` 中添加今日头条特定的校验规则。

### 步骤四：无需修改主流程

`main.js` 会自动从 `platforms.js` 读取平台列表并渲染，无需手动修改。

## 10. 异常情况处理

| 异常场景 | 处理方式 |
|----------|----------|
| 标题为空 | 显示 error 级别提示，阻止适配 |
| 正文为空 | 显示 error 级别提示，阻止适配 |
| 未选择平台 | 显示 error 级别提示，阻止适配 |
| 标题超长 | 显示 warning 级别提示，建议修改 |
| 标签过多 | 显示 warning 级别提示，建议精简 |
| 小红书正文超1000字 | 显示 error 级别提示 |
| localStorage 不可用 | console.error 降级处理 |
| Clipboard API 不可用 | 降级为 execCommand 方案 |

## 11. 未来真实发布扩展方案

如果未来需要对接真实平台 API，建议架构：

```text
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  前端    │ --> │   API 网关   │ --> │  平台发布器  │
│ (现有)   │     │  (Node/Go)   │     │             │
└──────────┘     └──────────────┘     ├─────────────┤
                                      │ WechatPub   │
                                      │ ZhihuPub    │
                                      │ BilibiliPub │
                                      │ XiaohongshuP│
                                      └─────────────┘
```

关键要求：
1. 平台密钥必须保存在服务端，前端不存储敏感信息。
2. 真实发布必须处理平台授权、内容审核、失败重试。
3. 需要实现发布状态回调，前端轮询或 WebSocket 获取状态。
4. 当前 MockPublisher 可作为开发和测试的降级方案。

---

## 参考与调研说明

本项目平台适配规则根据各平台常见发布习惯整理，不声称完全等同官方最新限制。技术实现基于 MDN 官方文档（localStorage、Clipboard API、Blob API）。项目结构和交互思路参考了开源社区的多平台发布工具设计，未复制任何第三方项目代码。
