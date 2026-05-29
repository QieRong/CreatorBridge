/**
 * CreatorBridge - 本地存储模块
 * 负责草稿保存、发布历史管理
 * 使用 localStorage 实现数据持久化
 */

;(function () {
  'use strict';

  // 存储键名常量
  var STORAGE_KEYS = {
    DRAFT: 'creatorbridge_draft',
    HISTORY: 'creatorbridge_publish_history'
  };

  /**
   * 安全读取 localStorage
   * @param {string} key - 存储键名
   * @returns {*} 解析后的数据，失败返回 null
   */
  function safeGet(key) {
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('读取 localStorage 失败 [' + key + ']：', e);
      return null;
    }
  }

  /**
   * 安全写入 localStorage
   * @param {string} key - 存储键名
   * @param {*} value - 要保存的数据
   * @returns {boolean} 是否写入成功
   */
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('写入 localStorage 失败 [' + key + ']：', e);
      return false;
    }
  }

  /**
   * 保存草稿到 localStorage
   * @param {Object} draft - 草稿内容（title, body, tags, media）
   */
  function saveDraft(draft) {
    if (!draft) return;
    safeSet(STORAGE_KEYS.DRAFT, {
      title: draft.title || '',
      body: draft.body || '',
      tags: draft.tags || '',
      media: draft.media || '',
      savedAt: new Date().toLocaleString('zh-CN')
    });
  }

  /**
   * 从 localStorage 加载草稿
   * @returns {Object|null} 草稿内容
   */
  function loadDraft() {
    return safeGet(STORAGE_KEYS.DRAFT);
  }

  /**
   * 保存一条发布历史记录
   * 将新记录追加到历史数组头部（最新的在前面）
   * @param {Object} publishResult - 发布结果对象
   */
  function savePublishHistory(publishResult) {
    if (!publishResult) return;

    var history = getPublishHistory();
    history.unshift(publishResult);

    // 限制最多保存 50 条历史记录，防止 localStorage 过大
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    safeSet(STORAGE_KEYS.HISTORY, history);
  }

  /**
   * 获取所有发布历史
   * @returns {Array} 历史记录数组
   */
  function getPublishHistory() {
    var data = safeGet(STORAGE_KEYS.HISTORY);
    return Array.isArray(data) ? data : [];
  }

  /**
   * 清空所有发布历史
   */
  function clearPublishHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.error('清空发布历史失败：', e);
    }
  }

  // 全局挂载
  window.Storage = {
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    savePublishHistory: savePublishHistory,
    getPublishHistory: getPublishHistory,
    clearPublishHistory: clearPublishHistory
  };

})();
