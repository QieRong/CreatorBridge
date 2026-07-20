/**
 * CreatorBridge - AI 适配安全工具
 * 负责校验 AI 返回结构，并按平台规则做不会破坏语义边界的本地兜底处理。
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AiUtils = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /**
   * 在不超过最大字符数的前提下优先保留完整句子。
   * 省略号计入最大长度，避免截断后再次违反平台限制。
   *
   * @param {string} text 待截断文本
   * @param {number} maxLength 最大字符数
   * @returns {string} 安全截断后的文本
   */
  function truncateBySentence(text, maxLength) {
    var source = text == null ? '' : String(text).trim();
    var limit = Number(maxLength);

    if (!Number.isFinite(limit) || limit <= 0) {
      return '';
    }

    if (source.length <= limit) {
      return source;
    }

    if (limit === 1) {
      return '…';
    }

    var availableLength = limit - 1;
    var prefix = source.slice(0, availableLength);
    var boundary = Math.max(
      prefix.lastIndexOf('。'),
      prefix.lastIndexOf('！'),
      prefix.lastIndexOf('？'),
      prefix.lastIndexOf('；'),
      prefix.lastIndexOf('\n')
    );
    var truncated = boundary >= 0 ? prefix.slice(0, boundary + 1).trim() : prefix.trim();

    return truncated + '…';
  }

  function normalizeTags(tags, maxTags) {
    if (!Array.isArray(tags)) {
      return [];
    }

    var seen = {};
    return tags.reduce(function (result, tag) {
      var safeTag = tag == null ? '' : String(tag).trim();
      if (safeTag && !seen[safeTag] && result.length < maxTags) {
        seen[safeTag] = true;
        result.push(safeTag);
      }
      return result;
    }, []);
  }

  /**
   * 验证并规整 AI 返回的 targets。
   * AI 缺少、重复或额外返回平台时返回 ok:false，由主流程使用规则适配回退。
   *
   * @param {Array} targets AI 返回的 targets
   * @param {string[]} selectedPlatformIds 用户选择的平台 ID
   * @param {Function} getPlatformById 获取平台配置的函数
   * @returns {{ok:boolean, targets?:Array, message?:string}}
   */
  function normalizeAiTargets(targets, selectedPlatformIds, getPlatformById) {
    if (!Array.isArray(targets) || !Array.isArray(selectedPlatformIds) || typeof getPlatformById !== 'function') {
      return { ok: false, message: 'AI 返回的平台数据格式无效' };
    }

    var selectedIds = selectedPlatformIds.map(function (id) { return String(id || '').trim(); }).filter(Boolean);
    if (selectedIds.length === 0) {
      return { ok: false, message: '未找到已选平台' };
    }

    var seen = {};
    var targetMap = {};

    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      if (!target || typeof target !== 'object') {
        return { ok: false, message: 'AI 返回了无效的平台内容' };
      }

      var platformId = String(target.platformId || '').trim();
      if (!platformId || selectedIds.indexOf(platformId) === -1 || seen[platformId]) {
        return { ok: false, message: 'AI 返回的平台与已选平台不一致' };
      }

      if (typeof target.title !== 'string' || !target.title.trim() || typeof target.body !== 'string' || !target.body.trim() || !Array.isArray(target.tags)) {
        return { ok: false, message: 'AI 返回的平台内容字段不完整' };
      }

      seen[platformId] = true;
      targetMap[platformId] = target;
    }

    if (targets.length !== selectedIds.length || selectedIds.some(function (id) { return !targetMap[id]; })) {
      return { ok: false, message: 'AI 返回的平台内容不完整' };
    }

    var normalizedTargets = selectedIds.map(function (platformId) {
      var config = getPlatformById(platformId);
      var target = targetMap[platformId];
      if (!config) {
        return null;
      }

      return {
        platformId: config.id,
        platformName: config.name,
        title: truncateBySentence(target.title, config.maxTitleLength),
        body: truncateBySentence(target.body, config.maxBodyLength),
        tags: normalizeTags(target.tags, config.maxTags)
      };
    });

    if (normalizedTargets.some(function (target) { return target === null; })) {
      return { ok: false, message: '本地平台配置不完整' };
    }

    return { ok: true, targets: normalizedTargets };
  }

  return {
    truncateBySentence: truncateBySentence,
    normalizeAiTargets: normalizeAiTargets
  };
});
