/**
 * CreatorBridge - AI 适配客户端
 * 仅向本地代理发送内容；API Key 从不进入浏览器。
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AiClient = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function requestAiAdapt(payload, fetchImpl, timeoutMs) {
    var request = fetchImpl || globalThis.fetch;
    if (typeof request !== 'function') {
      return Promise.reject(new Error('AI request is unavailable'));
    }

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs || 30000);

    return request('/api/ai-adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response || !response.ok) {
        throw new Error('AI request failed');
      }
      return response.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.targets)) {
        throw new Error('AI response is invalid');
      }
      return data.targets;
    }).finally(function () {
      clearTimeout(timeout);
    });
  }

  /**
   * 请求 AI 并在网络、服务或返回结构异常时返回规则引擎结果。
   * @returns {Promise<{mode:string, targets?:Array, contents?:Array, message?:string}>}
   */
  async function adaptWithFallback(options) {
    try {
      var targets = await requestAiAdapt(options.payload, options.fetchImpl, options.timeoutMs);
      var normalized = options.normalize(targets);
      if (!normalized || !normalized.ok) {
        throw new Error('AI targets are incomplete');
      }
      return { mode: 'ai', targets: normalized.targets };
    } catch (error) {
      return {
        mode: 'fallback',
        contents: options.fallback(),
        message: 'AI适配失败，已切换为本地规则适配'
      };
    }
  }

  return {
    adaptWithFallback: adaptWithFallback
  };
});
