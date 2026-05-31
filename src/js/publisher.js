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

  // ========== 任务队列核心逻辑 ==========

  var queueState = {
    batchId: null,
    payload: null,
    tasks: [],
    isRunning: false,
    mode: 'mock',
    connectorConfig: { baseUrl: '', token: '' },
    onProgress: null,
    onComplete: null
  };

  /**
   * 基于发布载荷创建任务队列
   * @param {Object} payload - 标准发布载荷 PublishPayload
   * @param {Function} onProgress - 进度回调 (tasks) => void
   * @param {Function} onComplete - 完成回调 (batchId, tasks) => void
   * @returns {boolean} 是否创建成功
   */
  function createTaskQueue(payload, onProgress, onComplete, mode, baseUrl, token) {
    if (!payload || !payload.targets || payload.targets.length === 0) return false;
    
    queueState.batchId = payload.batchId;
    queueState.payload = payload;
    queueState.isRunning = false;
    queueState.mode = mode || 'mock';
    queueState.connectorConfig = { baseUrl: baseUrl || '', token: token || '' };
    queueState.onProgress = onProgress;
    queueState.onComplete = onComplete;
    
    queueState.tasks = payload.targets.map(function(target, index) {
      return {
        taskId: payload.batchId + '-' + target.platformId,
        batchId: payload.batchId,
        platformId: target.platformId,
        platformName: target.platformName,
        status: 'pending',
        message: '等待发布',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        payloadSummary: {
          title: target.title || payload.source.title,
          contentLength: target.body ? target.body.length : 0
        },
        retryCount: 0
      };
    });
    
    return true;
  }

  function updateTaskStatus(taskId, status, message) {
    var task = null;
    for (var i = 0; i < queueState.tasks.length; i++) {
      if (queueState.tasks[i].taskId === taskId) {
        task = queueState.tasks[i];
        break;
      }
    }
    if (task) {
      task.status = status;
      task.message = message;
      task.updatedAt = new Date().toLocaleString('zh-CN');
      if (typeof queueState.onProgress === 'function') {
        queueState.onProgress(queueState.tasks);
      }
    }
  }

  /** 开始执行队列 */
  function runQueue() {
    if (queueState.isRunning || queueState.tasks.length === 0) return;
    queueState.isRunning = true;
    
    var currentTaskIndex = 0;
    
    function processNext() {
      // 找下一个未成功且未达到最大重试次数的任务
      while (currentTaskIndex < queueState.tasks.length) {
        var task = queueState.tasks[currentTaskIndex];
        if (task.status === 'pending' || task.status === 'failed') {
          break;
        }
        currentTaskIndex++;
      }
      
      if (currentTaskIndex >= queueState.tasks.length) {
        queueState.isRunning = false;
        if (typeof queueState.onComplete === 'function') {
          queueState.onComplete(queueState.batchId, queueState.tasks);
        }
        return;
      }
      
      var currentTask = queueState.tasks[currentTaskIndex];
      
      // validating
      updateTaskStatus(currentTask.taskId, 'validating', '校验中...');
      
      setTimeout(function() {
        // publishing
        updateTaskStatus(currentTask.taskId, 'publishing', '发布中...');
        
        setTimeout(function() {
          // Mock 模式保持稳定可复现；网络失败由 Connector 模式展示。
          updateTaskStatus(currentTask.taskId, 'success', '模拟发布成功');
          currentTaskIndex++;
          processNext();
        }, 800);
      }, 400);
    }
    
    processNext();
  }

  /**
   * 将载荷投递给自建连接器
   */
  async function sendToConnector(platformId, payload, baseUrl, token) {
    var url = baseUrl.replace(/\/$/, '') + '/api/publish/' + platformId;
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 15000); // 15秒超时

    try {
      var headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      var response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) throw new Error('Token 无效/过期 (401)');
        if (response.status === 500) throw new Error('连接器服务端异常 (500)');
        throw new Error('HTTP ' + response.status);
      }

      var result = await response.json();
      if (result && result.success === false) {
        throw new Error(result.message || '连接器返回失败状态');
      }

      return { status: 'success', message: '连接器已接收任务' };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return { status: 'failed', message: '请求超时 (15s)' };
      }
      return { status: 'failed', message: error.message || '网络连接异常' };
    }
  }

  /** 开始执行真实的连接器投递队列 */
  async function runConnectorQueue() {
    if (queueState.isRunning || queueState.tasks.length === 0) return;
    queueState.isRunning = true;
    
    var baseUrl = queueState.connectorConfig.baseUrl;
    var token = queueState.connectorConfig.token;

    for (var i = 0; i < queueState.tasks.length; i++) {
      var task = queueState.tasks[i];
      if (task.status === 'success' || task.status === 'publishing') continue;
      
      updateTaskStatus(task.taskId, 'publishing', '正在投递中...');
      
      var res = await sendToConnector(task.platformId, queueState.payload, baseUrl, token);
      
      if (res.status === 'success') {
        updateTaskStatus(task.taskId, 'success', res.message);
      } else {
        task.retryCount++;
        updateTaskStatus(task.taskId, 'failed', res.message);
      }
    }
    
    queueState.isRunning = false;
    if (typeof queueState.onComplete === 'function') {
      queueState.onComplete(queueState.batchId, queueState.tasks);
    }
  }

  /** 智能分发执行入口 */
  function executeQueue() {
    if (queueState.mode === 'connector') {
      runConnectorQueue();
    } else {
      runQueue();
    }
  }

  /** 重试指定失败任务 */
  function retryTask(taskId) {
    var task = null;
    for (var i = 0; i < queueState.tasks.length; i++) {
      if (queueState.tasks[i].taskId === taskId) {
        task = queueState.tasks[i];
        break;
      }
    }
    if (task && task.status === 'failed') {
      task.status = 'pending';
      task.message = '等待重试';
      if (typeof queueState.onProgress === 'function') {
        queueState.onProgress(queueState.tasks);
      }
      executeQueue();
    }
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
      // 【注意】此 publish 仅为向下兼容旧版接口的预留设计。
      // 真实 UI 的 Connector 分发已改为通过 executeQueue -> runConnectorQueue -> sendToConnector 进行真实的请求流转，
      // 不再走此处的静态成功返回。
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
    buildPublishPayload: buildPublishPayload,
    createTaskQueue: createTaskQueue,
    runQueue: runQueue,
    runConnectorQueue: runConnectorQueue,
    executeQueue: executeQueue,
    sendToConnector: sendToConnector,
    retryTask: retryTask,
    getTasks: function() { return queueState.tasks; }
  };

})();
