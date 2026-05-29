/**
 * CreatorBridge - 模拟发布模块
 * 负责模拟发布流程，生成发布批次号和发布结果
 * 
 * 本项目只实现 MockPublisher（模拟发布器）
 * 不连接任何真实平台接口
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
   * 模拟发布到选中的所有平台
   * @param {string} title - 原始标题
   * @param {Array} adaptedContents - 适配后内容数组
   * @returns {Object|null} 发布结果对象
   */
  function mockPublish(title, adaptedContents) {
    // 校验：必须有适配结果
    if (!Array.isArray(adaptedContents) || adaptedContents.length === 0) {
      console.warn('没有适配结果，无法发布');
      return null;
    }

    // 生成批次号
    var batchId = createBatchId();

    // 为每个平台生成模拟发布状态
    var platformResults = adaptedContents.map(function (content) {
      return createPlatformPublishResult(content);
    });

    // 使用 Models 创建发布结果
    if (Models && Models.createPublishResult) {
      return Models.createPublishResult(batchId, title || '无标题', platformResults);
    }

    // 降级方案：直接返回对象
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
   * 批量发布选中平台（对外接口）
   * @param {string} title - 原始标题
   * @param {Array} adaptedContents - 适配后内容数组
   * @returns {Object|null} 发布结果
   */
  function publishSelectedPlatforms(title, adaptedContents) {
    return mockPublish(title, adaptedContents);
  }

  // 全局挂载
  window.Publisher = {
    createBatchId: createBatchId,
    createPlatformPublishResult: createPlatformPublishResult,
    mockPublish: mockPublish,
    publishSelectedPlatforms: publishSelectedPlatforms
  };

})();
