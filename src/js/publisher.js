/**
 * CreatorBridge - 发布调度与分发层
 * 负责分发和调度具体的发布器（MockPublisher、CustomConnectorPublisher、PayloadExporter）
 * 
 * 本阶段新增发布器架构与数据载荷结构，保持兼容旧有的模拟发布流程。
 */

;(function () {
  'use strict';

  var Models = window.Models;

  /**
   * 生成发布批次号
   * 格式：PUB-YYYYMMDD-XXX
   * @returns {string} 批次号
   */
  function createBatchId() {
    var now = new Date();
    var dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    var seq = String(Math.floor(Math.random() * 900) + 100);
    return 'PUB-' + dateStr + '-' + seq;
  }

  /**
   * 为单个平台生成模拟发布结果
   * @param {Object} adaptedContent - 适配后的内容
   * @returns {Object} 单平台发布结果
   */
  function createPlatformPublishResult(adaptedContent) {
    if (!adaptedContent) {
      return {
        platformId: 'unknown',
        platformName: '未知平台',
        status: 'failed',
        message: '适配内容为空，无法发布'
      };
    }
    return {
      platformId: adaptedContent.platformId || '',
      platformName: adaptedContent.platformName || '',
      status: 'success',
      message: '模拟发布成功'
    };
  }

  /**
   * 模拟发布到选中的所有平台（旧流程保留函数）
   * @param {string} title - 原始标题
   * @param {Array} adaptedContents - 适配后内容数组
   * @returns {Object|null} 发布结果对象
   */
  function mockPublish(title, adaptedContents) {
    if (!Array.isArray(adaptedContents) || adaptedContents.length === 0) {
      console.warn('没有适配结果，无法发布');
      return null;
    }

    var batchId = createBatchId();
    var platformResults = adaptedContents.map(function (content) {
      return createPlatformPublishResult(content);
    });

    if (Models && Models.createPublishResult) {
      return Models.createPublishResult(batchId, title || '无标题', platformResults);
    }

    return {
      batchId: batchId,
      title: title || '无标题',
      mode: 'mock',
      status: 'success',
      publishedAt: new Date().toLocaleString('zh-CN'),
      platforms: platformResults
    };
  }

  /**
   * MockPublisher 本地模拟发布器
   * 负责纯本地的模拟发布逻辑，支持向下兼容旧流程。
   */
  var MockPublisher = {
    mode: 'mock',
    validateConfig: function () {
      return { valid: true, errors: [] };
    },
    buildPayload: function (unifiedContent, adaptedContents, options) {
      if (Models && Models.createPublishPayload) {
        return Models.createPublishPayload(unifiedContent, adaptedContents, 'mock', options);
      }
      return {};
    },
    publish: function (payload) {
      var batchId = payload.batchId || createBatchId();
      var title = (payload.source && payload.source.title) || '无标题';
      var platformResults = (payload.targets || []).map(function (target) {
        return {
          platformId: target.platformId,
          platformName: target.platformName,
          status: 'success',
          message: '模拟发布成功'
        };
      });

      if (Models && Models.createPublishResult) {
        return Models.createPublishResult(batchId, title, platformResults);
      }

      return {
        batchId: batchId,
        title: title,
        mode: 'mock',
        status: 'success',
        publishedAt: new Date().toLocaleString('zh-CN'),
        platforms: platformResults
      };
    }
  };

  /**
   * CustomConnectorPublisher 自定义连接器发布器
   * 负责自定义中转服务的接口架构设计预留，不包含敏感字段和特定平台官方接口地址。
   */
  var CustomConnectorPublisher = {
    mode: 'connector',
    validateConfig: function (config) {
      var apiBaseUrl = (config && config.apiBaseUrl != null) ? String(config.apiBaseUrl).trim() : '';
      var errors = [];
      if (!apiBaseUrl) {
        errors.push('自建连接器基础 API 地址 (apiBaseUrl) 未配置');
      }
      return {
        valid: errors.length === 0,
        errors: errors
      };
    },
    buildPayload: function (unifiedContent, adaptedContents, options) {
      if (Models && Models.createPublishPayload) {
        return Models.createPublishPayload(unifiedContent, adaptedContents, 'connector', options);
      }
      return {};
    },
    publish: function (payload, config, runtimeToken) {
      var batchId = payload.batchId || createBatchId();
      var title = (payload.source && payload.source.title) || '无标题';
      var targets = payload.targets || [];

      var validation = this.validateConfig(config);
      if (!validation.valid) {
        return {
          batchId: batchId,
          title: title,
          mode: 'connector',
          status: 'failed',
          publishedAt: new Date().toLocaleString('zh-CN'),
          platforms: targets.map(function (target) {
            return {
              platformId: target.platformId,
              platformName: target.platformName,
              status: 'failed',
              message: '配置检验失败：' + (validation.errors[0] || '配置异常')
            };
          })
        };
      }

      // 此处为连接器网络分发能力设计预留
      // 不保存 runtimeToken，不向 localStorage 写入敏感字段，不包含任何真实社交平台官方接口
      return {
        batchId: batchId,
        title: title,
        mode: 'connector',
        status: 'success',
        publishedAt: new Date().toLocaleString('zh-CN'),
        platforms: targets.map(function (target) {
          return {
            platformId: target.platformId,
            platformName: target.platformName,
            status: 'success',
            message: '连接器就绪，发布载荷投递成功(预留模式)'
          };
        })
      };
    }
  };

  /**
   * PayloadExporter 载荷导出器
   * 负责导出标准的 PublishPayload 协议数据为格式化的 JSON 字符串。
   */
  var PayloadExporter = {
    mode: 'payload',
    validateConfig: function () {
      return { valid: true, errors: [] };
    },
    buildPayload: function (unifiedContent, adaptedContents, options) {
      if (Models && Models.createPublishPayload) {
        return Models.createPublishPayload(unifiedContent, adaptedContents, 'payload', options);
      }
      return {};
    },
    exportPayload: function (payload) {
      if (!payload) {
        return '';
      }
      return JSON.stringify(payload, null, 2);
    }
  };

  // 映射发布实例
  var publisherMap = {
    mock: MockPublisher,
    connector: CustomConnectorPublisher,
    payload: PayloadExporter
  };

  /**
   * 根据模式获取发布实例
   * 模式未知时默认兜底返回 MockPublisher
   * @param {string} mode - 发布模式
   * @returns {Object} 发布实例
   */
  function getPublisher(mode) {
    var safeMode = (Models && Models.normalizePublishMode) ? Models.normalizePublishMode(mode) : 'mock';
    return publisherMap[safeMode] || MockPublisher;
  }

  /**
   * 构造标准发布载荷
   * @param {Object} unifiedContent - 统一内容
   * @param {Array} adaptedContents - 各平台内容数组
   * @param {string} mode - 模式
   * @param {Object} options - 配置参数
   * @returns {Object} 统一发布载荷
   */
  function buildPublishPayload(unifiedContent, adaptedContents, mode, options) {
    var publisher = getPublisher(mode);
    return publisher.buildPayload(unifiedContent, adaptedContents, options);
  }

  /**
   * 批量发布选中平台（向下兼容旧版外部接口）
   * 保持不影响主页面的“一键适配 → 模拟发布 → 发布历史”流转流程
   * 
   * @param {string} title - 原始标题
   * @param {Array} adaptedContents - 适配后内容数组
   * @returns {Object|null} 发布结果
   */
  function publishSelectedPlatforms(title, adaptedContents) {
    // 构造 UnifiedContent 作为中转层，确保新发布器能正常处理
    var unifiedContent = (Models && Models.createUnifiedContent) ?
      Models.createUnifiedContent(title, '', [], []) : { title: title };
    
    var publisher = getPublisher('mock');
    var payload = publisher.buildPayload(unifiedContent, adaptedContents);
    return publisher.publish(payload);
  }

  // 全局挂载
  window.Publisher = {
    createBatchId: createBatchId,
    createPlatformPublishResult: createPlatformPublishResult,
    mockPublish: mockPublish,
    publishSelectedPlatforms: publishSelectedPlatforms,
    MockPublisher: MockPublisher,
    CustomConnectorPublisher: CustomConnectorPublisher,
    PayloadExporter: PayloadExporter,
    getPublisher: getPublisher,
    buildPublishPayload: buildPublishPayload
  };

})();
