/**
 * CreatorBridge - 主入口模块
 * 负责页面初始化、事件绑定、流程调度
 * 
 * 第一阶段：基础页面交互（平台选择渲染、字数统计、清空）
 * 第二阶段：内容读取、一键适配、预览渲染
 * 第三阶段：格式检查、复制、模拟发布
 * 第四阶段：发布历史渲染
 */

;(function () {
  'use strict';

  // ========== DOM 元素引用 ==========

  var DOM = {
    // 输入区
    inputTitle: null,
    inputBody: null,
    inputTags: null,
    inputMedia: null,
    titleCounter: null,
    bodyCounter: null,

    // 平台选择
    platformSelector: null,

    // 按钮
    btnAdapt: null,
    btnPublish: null,
    btnExport: null,
    btnClear: null,
    btnClearHistory: null,

    // 功能区域
    sectionValidation: null,
    sectionPreview: null,
    sectionPublishResult: null,
    sectionHistory: null,

    // 列表容器
    validationList: null,
    previewGrid: null,
    publishResultCard: null,
    historyList: null,
    historyEmpty: null,

    // Toast 容器
    toastContainer: null
  };

  // ========== 全局状态 ==========

  var state = {
    selectedPlatforms: [],   // 选中的平台ID列表
    unifiedContent: null,    // 统一内容模型
    adaptedContents: [],     // 适配后内容数组
    validationMessages: [],  // 校验消息数组
    lastPublishResult: null  // 最近一次发布结果
  };

  // ========== 初始化 ==========

  /**
   * 缓存 DOM 元素引用
   */
  function cacheDOM() {
    DOM.inputTitle = document.getElementById('input-title');
    DOM.inputBody = document.getElementById('input-body');
    DOM.inputTags = document.getElementById('input-tags');
    DOM.inputMedia = document.getElementById('input-media');
    DOM.titleCounter = document.getElementById('title-counter');
    DOM.bodyCounter = document.getElementById('body-counter');

    DOM.platformSelector = document.getElementById('platform-selector');

    DOM.btnAdapt = document.getElementById('btn-adapt');
    DOM.btnPublish = document.getElementById('btn-publish');
    DOM.btnExport = document.getElementById('btn-export');
    DOM.btnClear = document.getElementById('btn-clear');
    DOM.btnClearHistory = document.getElementById('btn-clear-history');

    DOM.sectionValidation = document.getElementById('section-validation');
    DOM.sectionPreview = document.getElementById('section-preview');
    DOM.sectionPublishResult = document.getElementById('section-publish-result');
    DOM.sectionHistory = document.getElementById('section-history');

    DOM.validationList = document.getElementById('validation-list');
    DOM.previewGrid = document.getElementById('preview-grid');
    DOM.publishResultCard = document.getElementById('publish-result-card');
    DOM.historyList = document.getElementById('history-list');
    DOM.historyEmpty = document.getElementById('history-empty');

    DOM.toastContainer = document.getElementById('toast-container');
  }

  /**
   * 渲染平台选择器
   * 从 Platforms 模块读取配置，动态生成选择卡片
   */
  function renderPlatformSelector() {
    var platforms = window.Platforms?.getAllPlatforms() || [];
    if (!DOM.platformSelector) return;

    var html = '';
    platforms.forEach(function (p) {
      html += '<label class="platform-item" data-platform-id="' + p.id + '">';
      html += '  <input type="checkbox" value="' + p.id + '">';
      html += '  <span class="platform-check">✓</span>';
      html += '  <span class="platform-icon">' + p.icon + '</span>';
      html += '  <div class="platform-info">';
      html += '    <div class="platform-name">' + p.name + '</div>';
      html += '    <div class="platform-desc">' + p.description + '</div>';
      html += '  </div>';
      html += '</label>';
    });

    DOM.platformSelector.innerHTML = html;
  }

  // ========== 事件处理 ==========

  /**
   * 绑定平台选择事件
   */
  function bindPlatformEvents() {
    if (!DOM.platformSelector) return;

    DOM.platformSelector.addEventListener('click', function (e) {
      var item = e.target.closest('.platform-item');
      if (!item) return;

      var checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;

      // 切换选中状态
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);

      // 更新全局选中列表
      updateSelectedPlatforms();
    });
  }

  /**
   * 更新选中平台列表
   */
  function updateSelectedPlatforms() {
    var checkboxes = DOM.platformSelector?.querySelectorAll('input[type="checkbox"]:checked') || [];
    state.selectedPlatforms = [];
    checkboxes.forEach(function (cb) {
      state.selectedPlatforms.push(cb.value);
    });
  }

  /**
   * 绑定输入框字数统计事件
   */
  function bindInputCounters() {
    if (DOM.inputTitle && DOM.titleCounter) {
      DOM.inputTitle.addEventListener('input', function () {
        var len = DOM.inputTitle.value.length;
        DOM.titleCounter.textContent = len + ' / 100';
      });
    }

    if (DOM.inputBody && DOM.bodyCounter) {
      DOM.inputBody.addEventListener('input', function () {
        var len = DOM.inputBody.value.length;
        DOM.bodyCounter.textContent = len + ' 字';
      });
    }
  }

  /**
   * 绑定清空按钮事件
   */
  function bindClearButton() {
    if (!DOM.btnClear) return;

    DOM.btnClear.addEventListener('click', function () {
      // 清空输入框
      if (DOM.inputTitle) DOM.inputTitle.value = '';
      if (DOM.inputBody) DOM.inputBody.value = '';
      if (DOM.inputTags) DOM.inputTags.value = '';
      if (DOM.inputMedia) DOM.inputMedia.value = '';

      // 重置计数器
      if (DOM.titleCounter) DOM.titleCounter.textContent = '0 / 100';
      if (DOM.bodyCounter) DOM.bodyCounter.textContent = '0 字';

      // 取消平台选择
      var items = DOM.platformSelector?.querySelectorAll('.platform-item') || [];
      items.forEach(function (item) {
        item.classList.remove('selected');
        var cb = item.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      });
      state.selectedPlatforms = [];

      // 隐藏功能区域
      if (DOM.sectionValidation) DOM.sectionValidation.style.display = 'none';
      if (DOM.sectionPreview) DOM.sectionPreview.style.display = 'none';
      if (DOM.sectionPublishResult) DOM.sectionPublishResult.style.display = 'none';

      // 重置按钮状态
      if (DOM.btnPublish) DOM.btnPublish.disabled = true;
      if (DOM.btnExport) DOM.btnExport.disabled = true;

      // 重置状态
      state.unifiedContent = null;
      state.adaptedContents = [];
      state.validationMessages = [];
      state.lastPublishResult = null;

      showToast('已清空所有输入内容', 'info');
    });
  }

  /**
   * 绑定一键适配按钮事件（占位，第二阶段完善）
   */
  function bindAdaptButton() {
    if (!DOM.btnAdapt) return;

    DOM.btnAdapt.addEventListener('click', function () {
      // 第二阶段将实现完整适配逻辑
      showToast('一键适配功能将在第二阶段实现', 'info');
    });
  }

  /**
   * 绑定模拟发布按钮事件（占位，第三阶段完善）
   */
  function bindPublishButton() {
    if (!DOM.btnPublish) return;

    DOM.btnPublish.addEventListener('click', function () {
      // 第三阶段将实现完整发布逻辑
      showToast('模拟发布功能将在第三阶段实现', 'info');
    });
  }

  /**
   * 绑定导出按钮事件（占位）
   */
  function bindExportButton() {
    if (!DOM.btnExport) return;

    DOM.btnExport.addEventListener('click', function () {
      showToast('导出功能将在后续阶段实现', 'info');
    });
  }

  /**
   * 绑定清空历史按钮事件（占位，第四阶段完善）
   */
  function bindClearHistoryButton() {
    if (!DOM.btnClearHistory) return;

    DOM.btnClearHistory.addEventListener('click', function () {
      showToast('发布历史功能将在第四阶段实现', 'info');
    });
  }

  // ========== Toast 通知 ==========

  /**
   * 显示 Toast 提示
   * @param {string} message - 提示信息
   * @param {string} [type] - 类型：success / error / warning / info
   * @param {number} [duration] - 显示时长（毫秒），默认 3000
   */
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    var iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (iconMap[type] || 'ℹ️') + '</span>' +
      '<span>' + (window.Utils?.escapeHTML(message) || message) + '</span>';

    if (DOM.toastContainer) {
      DOM.toastContainer.appendChild(toast);
    }

    // 自动移除
    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // ========== 发布历史渲染（占位） ==========

  /**
   * 渲染发布历史列表
   * 第四阶段将实现完整逻辑
   */
  function renderHistory() {
    // 第四阶段实现
  }

  // ========== 应用入口 ==========

  /**
   * 应用初始化
   */
  function init() {
    console.log('CreatorBridge v1.0 初始化中...');

    // 1. 缓存 DOM 引用
    cacheDOM();

    // 2. 渲染平台选择器
    renderPlatformSelector();

    // 3. 绑定事件
    bindPlatformEvents();
    bindInputCounters();
    bindClearButton();
    bindAdaptButton();
    bindPublishButton();
    bindExportButton();
    bindClearHistoryButton();

    // 4. 渲染发布历史
    renderHistory();

    console.log('CreatorBridge 初始化完成 ✓');
  }

  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', init);

  // 暴露全局方法（供调试和后续模块调用）
  window.App = {
    showToast: showToast,
    getState: function () { return state; }
  };

})();
