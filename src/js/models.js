/**
 * CreatorBridge - 数据模型模块
 * 负责定义和创建项目中使用的核心数据结构
 * 包括：统一内容模型、平台适配内容模型、发布结果模型
 */

(function () {
  'use strict';

  /**
   * 创建统一内容模型（UnifiedContent）
   * 用于存储用户输入的原始内容，是所有平台适配的源数据
   *
   * @param {string} title - 原始标题
   * @param {string} body - 正文内容
   * @param {string[]} tags - 标签数组
   * @param {Array<{type: string, url: string, description: string}>} media - 素材列表
   * @returns {object} 统一内容对象
   */
  function createUnifiedContent(title, body, tags, media) {
    // 防御性处理：确保入参不为 undefined 或 null
    var safeTitle = (title != null) ? String(title) : '';
    var safeBody = (body != null) ? String(body) : '';
    var safeTags = Array.isArray(tags) ? tags.filter(function (t) { return t != null && String(t).trim() !== ''; }) : [];
    var safeMedia = Array.isArray(media) ? media : [];

    // 标准化素材列表中的每个素材对象
    var normalizedMedia = safeMedia.map(function (item) {
      if (item == null || typeof item !== 'object') {
        return { type: 'link', url: '', description: '' };
      }
      return {
        type: (item.type != null) ? String(item.type) : 'link',
        url: (item.url != null) ? String(item.url) : '',
        description: (item.description != null) ? String(item.description) : ''
      };
    });

    var now = new Date().toLocaleString('zh-CN');

    return {
      id: 'content_' + Date.now(),
      title: safeTitle,
      body: safeBody,
      tags: safeTags,
      media: normalizedMedia,
      metadata: {
        authorNote: '',
        createdAt: now,
        updatedAt: '',
        source: 'manual-input'
      }
    };
  }

  /**
   * 创建平台适配内容模型（AdaptedContent）
   * 用于存储经过平台适配器转换后的内容
   *
   * @param {string} platformId - 平台唯一标识，如 'wechat'
   * @param {string} platformName - 平台显示名称，如 '微信公众号'
   * @param {string} title - 适配后的标题
   * @param {string} body - 适配后的正文
   * @param {string[]} tags - 适配后的标签
   * @param {string[]} tips - 发布建议列表
   * @param {string[]} warnings - 风险提示列表
   * @param {number} estimatedLength - 预估字数
   * @returns {object} 平台适配内容对象
   */
  function createAdaptedContent(platformId, platformName, title, body, tags, tips, warnings, estimatedLength) {
    // 防御性处理：所有入参均做安全兜底
    var safePlatformId = (platformId != null) ? String(platformId) : '';
    var safePlatformName = (platformName != null) ? String(platformName) : '';
    var safeTitle = (title != null) ? String(title) : '';
    var safeBody = (body != null) ? String(body) : '';
    var safeTags = Array.isArray(tags) ? tags.filter(function (t) { return t != null; }) : [];
    var safeTips = Array.isArray(tips) ? tips.filter(function (t) { return t != null; }) : [];
    var safeWarnings = Array.isArray(warnings) ? warnings.filter(function (w) { return w != null; }) : [];
    var safeEstimatedLength = (typeof estimatedLength === 'number' && !isNaN(estimatedLength)) ? estimatedLength : 0;

    return {
      platformId: safePlatformId,
      platformName: safePlatformName,
      title: safeTitle,
      body: safeBody,
      tags: safeTags,
      tips: safeTips,
      warnings: safeWarnings,
      formatType: 'text-preview',
      estimatedLength: safeEstimatedLength,
      generatedAt: new Date().toLocaleString('zh-CN')
    };
  }

  /**
   * 创建模拟发布结果模型（PublishResult）
   * 用于记录一次模拟发布的完整结果
   *
   * @param {string} batchId - 发布批次号，如 'PUB-20260529-001'
   * @param {string} title - 原始内容标题
   * @param {Array<{platformId: string, platformName: string, status: string, message: string}>} platforms - 各平台发布状态
   * @returns {object} 发布结果对象
   */
  function createPublishResult(batchId, title, platforms) {
    var safeBatchId = (batchId != null) ? String(batchId) : '';
    var safeTitle = (title != null) ? String(title) : '';
    var safePlatforms = Array.isArray(platforms) ? platforms : [];

    // 标准化每个平台的发布状态对象
    var normalizedPlatforms = safePlatforms.map(function (p) {
      if (p == null || typeof p !== 'object') {
        return { platformId: '', platformName: '', status: 'unknown', message: '状态未知' };
      }
      return {
        platformId: (p.platformId != null) ? String(p.platformId) : '',
        platformName: (p.platformName != null) ? String(p.platformName) : '',
        status: (p.status != null) ? String(p.status) : 'unknown',
        message: (p.message != null) ? String(p.message) : ''
      };
    });

    return {
      batchId: safeBatchId,
      title: safeTitle,
      mode: 'mock',
      status: 'success',
      publishedAt: new Date().toLocaleString('zh-CN'),
      platforms: normalizedPlatforms
    };
  }

  /**
   * 标准化内容文本
   * 去掉首尾空白，将多个连续换行合并为两个换行
   *
   * @param {string} content - 待标准化的文本内容
   * @returns {string} 标准化后的文本
   */
  function normalizeContent(content) {
    if (content == null) {
      return '';
    }
    var text = String(content);

    // 去掉首尾空白
    text = text.trim();

    // 将三个及以上连续换行符合并为两个换行（保留段落间距）
    text = text.replace(/\n{3,}/g, '\n\n');

    return text;
  }

  /**
   * 规范化发布模式
   * 只允许返回 'mock', 'connector', 'payload'，其他一律兜底返回 'mock'
   *
   * @param {string} mode - 待验证的模式
   * @returns {string} 规范化后的模式
   */
  function normalizePublishMode(mode) {
    var m = (mode != null) ? String(mode).trim().toLowerCase() : 'mock';
    if (m === 'mock' || m === 'connector' || m === 'payload') {
      return m;
    }
    return 'mock';
  }

  /**
   * 创建默认的连接器配置对象（ConnectorConfig）
   * 为扩展发布模式设计预留，不包含敏感凭证字段。
   *
   * @param {object} options - 用于覆盖非敏感默认配置的可选参数
   * @returns {object} 连接器配置对象
   */
  function createConnectorConfig(options) {
    var defaultPlatformMapping = {
      wechat: { enabled: false, endpoint: '/publish/wechat', publishType: 'draft' },
      zhihu: { enabled: false, endpoint: '/publish/zhihu', publishType: 'draft' },
      bilibili: { enabled: false, endpoint: '/publish/bilibili', publishType: 'article' },
      xiaohongshu: { enabled: false, endpoint: '/publish/xiaohongshu', publishType: 'note' }
    };

    var config = {
      mode: 'mock',
      apiBaseUrl: '',
      authType: 'none',
      customHeaders: {},
      saveCredential: false,
      platformMapping: defaultPlatformMapping
    };

    if (options != null && typeof options === 'object') {
      // 安全覆盖 mode
      if (options.mode !== undefined) {
        config.mode = normalizePublishMode(options.mode);
      }
      // 安全覆盖 apiBaseUrl (必须是字符串)
      if (options.apiBaseUrl !== undefined) {
        config.apiBaseUrl = String(options.apiBaseUrl);
      }
      // 安全覆盖 authType
      if (options.authType !== undefined) {
        config.authType = String(options.authType);
      }
      // 安全覆盖 customHeaders (必须是对象)
      if (options.customHeaders != null && typeof options.customHeaders === 'object') {
        config.customHeaders = {};
        for (var key in options.customHeaders) {
          if (Object.prototype.hasOwnProperty.call(options.customHeaders, key)) {
            config.customHeaders[key] = String(options.customHeaders[key]);
          }
        }
      }
      // 安全覆盖 saveCredential
      if (options.saveCredential !== undefined) {
        config.saveCredential = Boolean(options.saveCredential);
      }
      // 安全覆盖 platformMapping
      if (options.platformMapping != null && typeof options.platformMapping === 'object') {
        config.platformMapping = {};
        var platforms = ['wechat', 'zhihu', 'bilibili', 'xiaohongshu'];
        platforms.forEach(function (platform) {
          var defaultItem = defaultPlatformMapping[platform];
          var optItem = options.platformMapping[platform];
          if (optItem != null && typeof optItem === 'object') {
            config.platformMapping[platform] = {
              enabled: optItem.enabled !== undefined ? Boolean(optItem.enabled) : defaultItem.enabled,
              endpoint: optItem.endpoint !== undefined ? String(optItem.endpoint) : defaultItem.endpoint,
              publishType: optItem.publishType !== undefined ? String(optItem.publishType) : defaultItem.publishType
            };
          } else {
            config.platformMapping[platform] = defaultItem;
          }
        });
      }
    }

    return config;
  }

  /**
   * 内部方法：生成唯一的发布批次号
   * 格式：PUB-YYYYMMDD-XXX
   * @returns {string} 批次号
   */
  function generateLocalBatchId() {
    var now = new Date();
    var dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    var seq = String(Math.floor(Math.random() * 900) + 100);
    return 'PUB-' + dateStr + '-' + seq;
  }

  /**
   * 创建统一发布载荷对象（PublishPayload）
   * 为自定义中转服务和导出模式设计预留，不包含敏感身份凭证。
   *
   * @param {object} unifiedContent - 统一内容数据对象，可为空
   * @param {Array} adaptedContents - 各平台适配后的内容数组，可为空
   * @param {string} mode - 发布模式 (mock | connector | payload)
   * @param {object} options - 可选配置覆盖参数
   * @returns {object} 发布载荷对象
   */
  function createPublishPayload(unifiedContent, adaptedContents, mode, options) {
    var safeMode = normalizePublishMode(mode);
    var now = new Date().toLocaleString('zh-CN');

    // 1. 组装 source 原始信息
    var sourceData = {
      contentId: '',
      title: '',
      tags: [],
      createdAt: ''
    };
    if (unifiedContent != null && typeof unifiedContent === 'object') {
      sourceData.contentId = (unifiedContent.id != null) ? String(unifiedContent.id) : '';
      sourceData.title = (unifiedContent.title != null) ? String(unifiedContent.title) : '';
      if (Array.isArray(unifiedContent.tags)) {
        sourceData.tags = unifiedContent.tags.filter(function (t) { return t != null; }).map(String);
      }
      if (unifiedContent.metadata != null && typeof unifiedContent.metadata === 'object') {
        sourceData.createdAt = (unifiedContent.metadata.createdAt != null) ? String(unifiedContent.metadata.createdAt) : '';
      }
    }

    // 2. 组装 targets 适配后信息，去除无关敏感字段
    var targetList = [];
    if (Array.isArray(adaptedContents)) {
      targetList = adaptedContents.map(function (item) {
        if (item == null || typeof item !== 'object') {
          return null;
        }
        return {
          platformId: (item.platformId != null) ? String(item.platformId) : '',
          platformName: (item.platformName != null) ? String(item.platformName) : '',
          title: (item.title != null) ? String(item.title) : '',
          body: (item.body != null) ? String(item.body) : '',
          tags: Array.isArray(item.tags) ? item.tags.filter(function (t) { return t != null; }).map(String) : [],
          formatType: (item.formatType != null) ? String(item.formatType) : 'text-preview',
          media: Array.isArray(item.media) ? item.media : [],
          tips: Array.isArray(item.tips) ? item.tips.filter(function (t) { return t != null; }).map(String) : [],
          warnings: Array.isArray(item.warnings) ? item.warnings.filter(function (w) { return w != null; }).map(String) : []
        };
      }).filter(function (t) { return t != null; });
    }

    // 3. 组装 options 发布选项
    var publishOptions = {
      dryRun: true,
      publishNow: false,
      saveAsDraft: true
    };
    if (options != null && typeof options === 'object') {
      if (options.dryRun !== undefined) {
        publishOptions.dryRun = Boolean(options.dryRun);
      }
      if (options.publishNow !== undefined) {
        publishOptions.publishNow = Boolean(options.publishNow);
      }
      if (options.saveAsDraft !== undefined) {
        publishOptions.saveAsDraft = Boolean(options.saveAsDraft);
      }
    }

    return {
      batchId: generateLocalBatchId(),
      mode: safeMode,
      source: sourceData,
      targets: targetList,
      options: publishOptions,
      createdAt: now
    };
  }

  // 挂载到全局对象
  window.Models = {
    createUnifiedContent: createUnifiedContent,
    createAdaptedContent: createAdaptedContent,
    createPublishResult: createPublishResult,
    normalizeContent: normalizeContent,
    normalizePublishMode: normalizePublishMode,
    createConnectorConfig: createConnectorConfig,
    createPublishPayload: createPublishPayload
  };
})();
