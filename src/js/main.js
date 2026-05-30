/**
 * CreatorBridge - 主入口模块
 * 负责页面初始化、事件绑定、流程调度（暗色控制台重构版）
 */

;(function () {
  'use strict';

  var Utils = window.Utils;
  var Models = window.Models;
  var Platforms = window.Platforms;
  var Adapters = window.Adapters;
  var Validator = window.Validator;
  var Publisher = window.Publisher;
  var StorageMod = window.Storage;

  // ========== DOM 元素引用 ==========
  var DOM = {};

  // ========== 全局状态 ==========
  var state = {
    selectedPlatforms: [],
    unifiedContent: null,
    adaptedContents: [],
    validationMessages: [],
    unifiedPayload: null,
    mediaAssets: [],
    activeTabPlatformId: null
  };

  /** 缓存 DOM 元素引用 */
  function cacheDOM() {
    DOM.inputTitle = document.getElementById('input-title');
    DOM.inputBody = document.getElementById('input-body');
    DOM.inputTags = document.getElementById('input-tags');
    DOM.inputMedia = document.getElementById('input-media');
    DOM.mediaPreviewContainer = document.getElementById('media-preview-container');
    
    DOM.titleCounter = document.getElementById('title-counter');
    DOM.bodyCounter = document.getElementById('body-counter');
    DOM.readTime = document.getElementById('read-time');
    
    DOM.platformSelector = document.getElementById('platform-selector');
    
    // Top Bar Buttons
    DOM.btnAdapt = document.getElementById('btn-adapt');
    DOM.btnPublish = document.getElementById('btn-publish');
    DOM.btnExportPkg = document.getElementById('btn-export-pkg');
    DOM.btnSaveDraft = document.getElementById('btn-save-draft');

    // Stats
    DOM.statPlatforms = document.getElementById('stat-platforms');
    DOM.statMedia = document.getElementById('stat-media');
    DOM.statQueue = document.getElementById('stat-queue');

    // Middle Column
    DOM.platformTabs = document.getElementById('platform-tabs');
    DOM.tabContentArea = document.getElementById('tab-content-area');
    DOM.previewEmpty = document.getElementById('preview-empty');

    // Right Column
    DOM.queueList = document.getElementById('queue-list');
    DOM.btnCopyPayload = document.getElementById('btn-copy-payload');
    DOM.payloadCode = document.getElementById('payload-code');
    DOM.btnClearHistory = document.getElementById('btn-clear-history');
    DOM.historyList = document.getElementById('history-list');
    DOM.historyEmpty = document.getElementById('history-empty');

    DOM.toastContainer = document.getElementById('toast-container');
  }

  // ========== 初始化渲染 ==========

  function renderPlatformSelector() {
    var platforms = Platforms?.getAllPlatforms() || [];
    if (!DOM.platformSelector) return;

    var html = '';
    platforms.forEach(function (p) {
      html += '<label class="platform-item" data-platform-id="' + p.id + '">';
      html += '  <input type="checkbox" value="' + p.id + '" style="display:none">';
      html += '  <span class="platform-check">✓</span>';
      html += '  <div class="platform-info">';
      html += '    <div class="platform-name">' + p.name + '</div>';
      html += '    <div class="platform-desc">' + (Utils?.escapeHTML(p.description) || p.description) + '</div>';
      html += '  </div>';
      html += '</label>';
    });
    DOM.platformSelector.innerHTML = html;
  }

  // ========== 事件绑定 ==========

  function bindPlatformEvents() {
    if (!DOM.platformSelector) return;
    DOM.platformSelector.addEventListener('click', function (e) {
      var item = e.target.closest('.platform-item');
      if (!item) return;
      var checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      
      // Prevent double toggle if clicking the checkbox itself vs the label wrapper
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      item.classList.toggle('selected', checkbox.checked);
      updateSelectedPlatforms();
    });
  }

  function updateSelectedPlatforms() {
    var checkboxes = DOM.platformSelector?.querySelectorAll('input[type="checkbox"]:checked') || [];
    state.selectedPlatforms = [];
    checkboxes.forEach(function (cb) {
      state.selectedPlatforms.push(cb.value);
    });
    if (DOM.statPlatforms) {
      DOM.statPlatforms.textContent = state.selectedPlatforms.length;
    }
  }

  function bindInputCounters() {
    if (DOM.inputTitle && DOM.titleCounter) {
      DOM.inputTitle.addEventListener('input', function () {
        DOM.titleCounter.textContent = DOM.inputTitle.value.length + ' / 100';
      });
    }
    if (DOM.inputBody && DOM.bodyCounter) {
      DOM.inputBody.addEventListener('input', function () {
        var len = DOM.inputBody.value.length;
        DOM.bodyCounter.textContent = '字数统计: ' + len + ' 字';
        if (DOM.readTime) {
          DOM.readTime.textContent = '预计阅读: ' + Math.ceil(len / 300) + ' 分钟';
        }
      });
    }
  }

  function bindMediaUpload() {
    if (!DOM.inputMedia) return;
    DOM.inputMedia.addEventListener('change', function (e) {
      var files = e.target.files;
      if (!files || files.length === 0) return;

      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var previewUrl = '';
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          previewUrl = URL.createObjectURL(file);
        }
        state.mediaAssets.push({
          id: 'local-' + Date.now() + '-' + i,
          name: file.name,
          type: file.type,
          size: file.size,
          category: file.type.startsWith('video/') ? 'video' : 'image',
          source: 'local-preview',
          previewUrl: previewUrl
        });
      }
      renderMediaPreview();
      DOM.inputMedia.value = '';
      if (DOM.statMedia) DOM.statMedia.textContent = state.mediaAssets.length;
    });
  }

  function renderMediaPreview() {
    if (!DOM.mediaPreviewContainer) return;
    var html = '';
    state.mediaAssets.forEach(function (asset, index) {
      html += '<div class="media-preview-item" title="' + Utils.escapeHTML(asset.name) + '">';
      if (asset.category === 'image') {
        html += '<img src="' + asset.previewUrl + '" alt="preview">';
      } else if (asset.category === 'video') {
        html += '<video src="' + asset.previewUrl + '" muted></video>';
      }
      html += '<button class="media-remove-btn" data-index="' + index + '">✕</button>';
      html += '</div>';
    });
    DOM.mediaPreviewContainer.innerHTML = html;
    
    // Bind remove buttons
    var removeBtns = DOM.mediaPreviewContainer.querySelectorAll('.media-remove-btn');
    removeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-index'));
        if (state.mediaAssets[idx].previewUrl) {
          URL.revokeObjectURL(state.mediaAssets[idx].previewUrl);
        }
        state.mediaAssets.splice(idx, 1);
        renderMediaPreview();
        if (DOM.statMedia) DOM.statMedia.textContent = state.mediaAssets.length;
      });
    });
  }

  // ========== 草稿保存/加载 ==========

  function bindDraftEvents() {
    if (DOM.btnSaveDraft) {
      DOM.btnSaveDraft.addEventListener('click', function() {
        var title = DOM.inputTitle?.value || '';
        var body = DOM.inputBody?.value || '';
        var tags = DOM.inputTags?.value || '';
        if (!title && !body) {
          showToast('内容为空，无需保存', 'info');
          return;
        }
        var draft = { title: title, body: body, tags: tags, updatedAt: Date.now() };
        StorageMod?.saveDraft(draft);
        showToast('草稿已保存', 'success');
      });
    }

    // 初始化时加载草稿
    var draft = StorageMod?.loadDraft();
    if (draft) {
      if (DOM.inputTitle && draft.title) DOM.inputTitle.value = draft.title;
      if (DOM.inputBody && draft.body) DOM.inputBody.value = draft.body;
      if (DOM.inputTags && draft.tags) DOM.inputTags.value = draft.tags;
      // 触发字数统计更新
      if (DOM.inputTitle) DOM.inputTitle.dispatchEvent(new Event('input'));
      if (DOM.inputBody) DOM.inputBody.dispatchEvent(new Event('input'));
      showToast('已恢复上次编辑内容', 'info');
    }
  }

  // ========== 核心流程：一键适配 ==========

  function bindAdaptButton() {
    if (!DOM.btnAdapt) return;
    DOM.btnAdapt.addEventListener('click', handleAdapt);
  }

  function handleAdapt() {
    var title = DOM.inputTitle?.value?.trim() || '';
    var body = DOM.inputBody?.value || '';
    var tagsStr = DOM.inputTags?.value || '';
    var mediaStr = state.mediaAssets.length > 0 ? '已附加 ' + state.mediaAssets.length + ' 个素材' : '';

    var rawMessages = Validator?.validateRawContent(title, body, tagsStr, mediaStr, state.selectedPlatforms) || [];
    var hasError = rawMessages.some(function (m) { return m.level === 'error'; });
    
    if (hasError) {
      state.validationMessages = rawMessages;
      renderTabsAndPreviews([], rawMessages);
      showToast('请修复错误后再适配', 'error');
      if (DOM.btnPublish) DOM.btnPublish.disabled = true;
      if (DOM.btnExportPkg) DOM.btnExportPkg.disabled = true;
      return;
    }

    var tags = Utils?.splitTags(tagsStr) || [];
    var media = mediaStr ? [{ type: 'local', url: mediaStr, description: mediaStr }] : [];

    state.unifiedContent = Models?.createUnifiedContent(title, body, tags, media) || {
      id: 'content_' + Date.now(), title: title, body: body, tags: tags, media: media
    };

    state.adaptedContents = Adapters?.adaptContentForSelectedPlatforms(state.selectedPlatforms, state.unifiedContent) || [];
    var adaptedMessages = Validator?.validateAdaptedContent(state.adaptedContents) || [];
    
    var infoMessages = rawMessages.filter(function (m) { return m.level === 'info'; });
    state.validationMessages = infoMessages.concat(adaptedMessages);

    // Render Middle Column
    renderTabsAndPreviews(state.adaptedContents, state.validationMessages);

    // Toggle Buttons
    hasError = state.validationMessages.some(function (m) { return m.level === 'error'; });
    if (DOM.btnPublish) DOM.btnPublish.disabled = hasError;
    if (DOM.btnExportPkg) DOM.btnExportPkg.disabled = false;

    // Build Payload
    if (Publisher && Publisher.buildPublishPayload) {
      state.unifiedPayload = Publisher.buildPublishPayload(state.unifiedContent, state.adaptedContents, 'payload', { mediaAssets: state.mediaAssets });
    }
    
    if (state.unifiedPayload && DOM.payloadCode) {
      DOM.payloadCode.textContent = JSON.stringify(state.unifiedPayload, null, 2);
      if (DOM.btnCopyPayload) DOM.btnCopyPayload.disabled = false;
    } else {
      if (DOM.payloadCode) DOM.payloadCode.textContent = '载荷生成失败';
      if (DOM.btnCopyPayload) DOM.btnCopyPayload.disabled = true;
    }

    showToast('适配完成，请在右侧检查各平台预览', 'success');
  }

  // ========== 中栏渲染：Tabs 与 预览 ==========

  function renderTabsAndPreviews(adaptedContents, messages) {
    if (!DOM.platformTabs || !DOM.tabContentArea) return;

    if (!adaptedContents || adaptedContents.length === 0) {
      DOM.platformTabs.innerHTML = '<div class="tab-empty-hint">未生成任何适配内容</div>';
      var errHtml = renderValidationHtml(messages); // 可能有未选平台的错误
      DOM.tabContentArea.innerHTML = errHtml || '<div class="empty-state" id="preview-empty"><div class="empty-icon">📱</div><p>请在左侧输入内容并点击“一键适配”</p></div>';
      return;
    }

    // 1. Render Tabs
    var tabsHtml = '';
    adaptedContents.forEach(function(content, idx) {
      var isActive = (state.activeTabPlatformId === content.platformId) || (idx === 0 && !state.activeTabPlatformId);
      if (isActive) state.activeTabPlatformId = content.platformId; // setup initial active
      tabsHtml += '<div class="tab-item ' + (isActive ? 'active' : '') + '" data-tab="' + content.platformId + '">';
      tabsHtml += Utils.escapeHTML(content.platformName) + '</div>';
    });
    DOM.platformTabs.innerHTML = tabsHtml;

    // 2. Render Cards
    var cardsHtml = '';
    adaptedContents.forEach(function(content) {
      var isActive = state.activeTabPlatformId === content.platformId;
      var platformMsg = messages.filter(function(m) { return m.platform === content.platformName || m.platform === '通用'; });
      
      cardsHtml += '<div class="preview-card ' + (isActive ? 'active' : '') + '" id="preview-card-' + content.platformId + '">';
      
      // Content Box
      cardsHtml += '  <div class="preview-content-box">';
      cardsHtml += '    <div class="preview-title">' + Utils.escapeHTML(content.title) + '</div>';
      cardsHtml += '    <div class="preview-body">' + Utils.escapeHTML(content.body) + '</div>';
      if (content.tags && content.tags.length > 0) {
        cardsHtml += '  <div class="preview-tags">';
        content.tags.forEach(function(tag) { cardsHtml += '<span class="preview-tag">' + Utils.escapeHTML(tag) + '</span>'; });
        cardsHtml += '  </div>';
      }
      cardsHtml += '    <button class="btn btn-secondary btn-sm" onclick="App.handleCopy(\'' + content.platformId + '\')">📋 复制该平台内容</button>';
      cardsHtml += '  </div>';

      // Validation Panel
      cardsHtml += '  <div class="validation-panel">';
      cardsHtml += '    <div class="validation-title">校验与建议</div>';
      if (platformMsg.length > 0) {
        cardsHtml += renderValidationHtml(platformMsg);
      } else {
        cardsHtml += '<div class="validation-list"><div class="validation-item success">✅ 符合平台规范，无警告。</div></div>';
      }
      cardsHtml += '  </div>';

      cardsHtml += '</div>';
    });

    DOM.tabContentArea.innerHTML = cardsHtml;
    bindTabClicks();
  }

  function renderValidationHtml(messages) {
    if (!messages || messages.length === 0) return '';
    var html = '<div class="validation-list">';
    var iconMap = { error: '❌', warning: '⚠️', info: '💡', success: '✅' };
    messages.forEach(function (msg) {
      var level = msg.level || 'info';
      var icon = iconMap[level];
      html += '<div class="validation-item ' + level + '">';
      html += '<span>' + icon + '</span>';
      html += '<span>' + Utils.escapeHTML(msg.message) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function bindTabClicks() {
    var tabs = DOM.platformTabs.querySelectorAll('.tab-item');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var targetId = tab.getAttribute('data-tab');
        state.activeTabPlatformId = targetId;
        
        // Update tab styling
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        // Update card visibility
        var cards = DOM.tabContentArea.querySelectorAll('.preview-card');
        cards.forEach(function(c) {
          if (c.id === 'preview-card-' + targetId) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      });
    });
  }

  // ========== 复制与导出 ==========

  function handleCopy(platformId) {
    var content = state.adaptedContents.find(function (c) { return c.platformId === platformId; });
    if (!content) return;

    var copyText = '【' + content.platformName + '】\n\n标题：' + content.title + '\n\n正文：\n' + content.body + '\n\n';
    if (content.tags && content.tags.length > 0) copyText += '标签：' + content.tags.join('、') + '\n\n';
    
    var copyPromise = Utils?.copyToClipboard(copyText);
    if (copyPromise) {
      copyPromise.then(function () { showToast(content.platformName + ' 已复制', 'success'); })
        .catch(function () { showToast('复制失败', 'error'); });
    }
  }

  function bindExportButton() {
    if (DOM.btnExportPkg) {
      DOM.btnExportPkg.addEventListener('click', function() {
        if (!state.unifiedPayload) {
          showToast('无可用发布包数据', 'warning');
          return;
        }
        var jsonText = JSON.stringify(state.unifiedPayload, null, 2);
        var filename = 'CreatorBridge_PublishPackage_' + Date.now() + '.json';
        Utils?.downloadTextFile(filename, jsonText);
        showToast('发布包已下载', 'success');
      });
    }
  }

  function bindPayloadEvents() {
    if (DOM.btnCopyPayload) {
      DOM.btnCopyPayload.addEventListener('click', function() {
        if (!state.unifiedPayload) return;
        var jsonText = JSON.stringify(state.unifiedPayload, null, 2);
        Utils?.copyToClipboard(jsonText).then(function() {
          showToast('Payload 已复制', 'success');
        });
      });
    }
  }

  // ========== 模拟发布与历史 ==========

  function bindPublishButton() {
    if (!DOM.btnPublish) return;
    DOM.btnPublish.addEventListener('click', function() {
      if (!state.unifiedPayload) {
        showToast('请先适配内容', 'warning');
        return;
      }
      
      var hasError = state.validationMessages.some(function (m) { return m.level === 'error'; });
      if (hasError) {
        showToast('有阻断性错误未修复', 'error');
        return;
      }

      var success = Publisher.createTaskQueue(
        state.unifiedPayload,
        function onProgress(tasks) {
          renderQueue(tasks);
        },
        function onComplete(batchId, tasks) {
          var title = state.unifiedContent?.title || '无标题';
          var platforms = tasks.map(function(t) {
            return { platformId: t.platformId, platformName: t.platformName, status: t.status, message: t.message };
          });
          var result = Models.createPublishResult(batchId, title, platforms);
          StorageMod?.savePublishHistory(result);
          renderHistory();
          showToast('模拟发布流程结束', 'success');
        }
      );

      if (success) {
        Publisher.runQueue();
      } else {
        showToast('队列创建失败', 'error');
      }
    });
  }

  function renderQueue(tasks) {
    if (!DOM.queueList) return;
    if (!tasks || tasks.length === 0) {
      DOM.queueList.innerHTML = '<div class="empty-state"><p>暂无任务</p></div>';
      if (DOM.statQueue) DOM.statQueue.textContent = '0';
      return;
    }
    
    var pendingCount = tasks.filter(function(t) { return t.status !== 'success' && t.status !== 'failed'; }).length;
    if (DOM.statQueue) DOM.statQueue.textContent = pendingCount;

    var html = '';
    tasks.forEach(function(task) {
      html += '<div class="queue-item">';
      html += '  <div class="queue-info">';
      html += '    <div class="queue-platform">' + Utils.escapeHTML(task.platformName) + '</div>';
      html += '    <div class="queue-time">目标: ' + Utils.escapeHTML(task.payloadSummary.title).substring(0, 10) + '...</div>';
      html += '  </div>';
      html += '  <span class="queue-status-badge queue-status-' + task.status + '">' + Utils.escapeHTML(task.message) + '</span>';
      html += '</div>';
    });
    DOM.queueList.innerHTML = html;
  }

  function renderHistory() {
    if (!DOM.historyList) return;
    var history = StorageMod?.getPublishHistory() || [];

    if (history.length === 0) {
      DOM.historyList.innerHTML = '<div class="empty-state"><p>暂无发布历史</p></div>';
      return;
    }

    var html = '';
    history.forEach(function (record) {
      var badges = '';
      if (record.platforms) {
        record.platforms.forEach(function(p) {
          badges += '<span class="badge">' + Utils.escapeHTML(p.platformName) + '</span>';
        });
      }
      html += '<div class="history-item">';
      html += '  <div class="history-batch">' + Utils.escapeHTML(record.batchId) + '</div>';
      html += '  <div class="history-title">' + Utils.escapeHTML(record.title) + '</div>';
      html += '  <div class="history-platforms">' + badges + '</div>';
      html += '</div>';
    });
    DOM.historyList.innerHTML = html;
  }

  function bindClearHistoryButton() {
    if (DOM.btnClearHistory) {
      DOM.btnClearHistory.addEventListener('click', function() {
        StorageMod?.clearPublishHistory();
        renderHistory();
        showToast('历史已清空', 'success');
      });
    }
  }

  // ========== Toast 通知 ==========

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    if (DOM.toastContainer) {
      var activeToasts = DOM.toastContainer.querySelectorAll('.toast');
      for (var i = 0; i < activeToasts.length; i++) {
        if ((activeToasts[i].textContent || '').trim() === message.trim()) return;
      }
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span>' + Utils.escapeHTML(message) + '</span>';
    if (DOM.toastContainer) DOM.toastContainer.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, duration);
  }

  // Back to top (复用之前的逻辑)
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== 初始化 ==========

  function init() {
    console.log('CreatorBridge Dark Theme 初始化...');
    cacheDOM();
    renderPlatformSelector();
    bindPlatformEvents();
    bindInputCounters();
    bindMediaUpload();
    bindAdaptButton();
    bindPublishButton();
    bindExportButton();
    bindPayloadEvents();
    bindClearHistoryButton();
    bindDraftEvents();
    renderHistory();
    initBackToTop();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.App = {
    showToast: showToast,
    handleCopy: handleCopy
  };

})();
