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

  // 挂载到全局对象
  window.Models = {
    createUnifiedContent: createUnifiedContent,
    createAdaptedContent: createAdaptedContent,
    createPublishResult: createPublishResult,
    normalizeContent: normalizeContent
  };
})();
