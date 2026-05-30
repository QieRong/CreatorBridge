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
    activeTabPlatformId: null,
    connectorConfig: { enabled: false, baseUrl: '' },
    runtimeToken: ''
  };

  var PLATFORM_ICONS = {
    'wechat': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 10C17 7.23858 14.7614 5 12 5C9.23858 5 7 7.23858 7 10C7 12.7614 9.23858 15 12 15C13.0673 15 14.0567 14.6656 14.8697 14.0934L17.5 15.5L16.7118 13.1362C16.9015 12.1931 17 11.1444 17 10Z"></path><path d="M22 15C22 12.7909 20.2091 11 18 11C15.7909 11 14 12.7909 14 15C14 17.2091 15.7909 19 18 19C18.8525 19 19.642 18.7324 20.2926 18.2747L22.3995 19.3995L21.7686 17.5057C21.9198 16.751 22 15.9189 22 15Z"></path></svg>',
    'zhihu': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M9 11h6"></path></svg>',
    'bilibili': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="12" rx="2"></rect><path d="M8 3l3 4M16 3l-3 4M9 12h.01M15 12h.01"></path></svg>',
    'xiaohongshu': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"></path><path d="M12 8v8M9 11l3 3 3-3"></path></svg>',
    'weibo': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"></path></svg>',
    'default': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>'
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
    DOM.btnFillDemo = document.getElementById('btn-fill-demo');
    DOM.btnViewConnector = document.getElementById('btn-view-connector');
    DOM.stepIndicator = document.getElementById('step-indicator');

    // Right Column
    DOM.queueList = document.getElementById('queue-list');
    DOM.btnCopyPayload = document.getElementById('btn-copy-payload');
    DOM.payloadCode = document.getElementById('payload-code');
    DOM.btnClearHistory = document.getElementById('btn-clear-history');
    DOM.historyList = document.getElementById('history-list');
    DOM.historyEmpty = document.getElementById('history-empty');

    DOM.toastContainer = document.getElementById('toast-container');
    
    // Modal
    DOM.btnSettings = document.getElementById('btn-settings');
    DOM.modeBadge = document.getElementById('mode-badge');
    DOM.connectorModal = document.getElementById('connector-modal');
    DOM.btnCloseModal = document.getElementById('btn-close-modal');
    DOM.toggleConnector = document.getElementById('toggle-connector');
    DOM.inputBaseUrl = document.getElementById('input-base-url');
    DOM.inputRuntimeToken = document.getElementById('input-runtime-token');
    DOM.btnTestConnection = document.getElementById('btn-test-connection');
    DOM.btnSaveSettings = document.getElementById('btn-save-settings');
  }

  function updateButtonStates() {
    var title = DOM.inputTitle?.value?.trim() || '';
    var body = DOM.inputBody?.value?.trim() || '';
    var hasPlatform = state.selectedPlatforms.length > 0;
    
    // Update process indicator
    if (DOM.stepIndicator) {
      if (title && body) {
        DOM.stepIndicator.textContent = '内容已填写';
        DOM.stepIndicator.style.color = 'var(--color-success)';
      } else {
        DOM.stepIndicator.textContent = '步骤 1 / 3：编辑内容';
        DOM.stepIndicator.style.color = 'var(--text-secondary)';
      }
    }

    // Adapt Button
    if (DOM.btnAdapt) {
      if (title && body && hasPlatform) {
        DOM.btnAdapt.disabled = false;
        DOM.btnAdapt.title = '一键生成平台适配结果';
      } else {
        DOM.btnAdapt.disabled = true;
        DOM.btnAdapt.title = '请先填写标题、正文并选择发布平台';
      }
    }

    // Publish Button
    if (DOM.btnPublish) {
      var hasAdapted = state.adaptedContents && state.adaptedContents.length > 0;
      if (hasAdapted) {
        DOM.btnPublish.disabled = false;
        DOM.btnPublish.title = '模拟发布到选中的平台';
      } else {
        DOM.btnPublish.disabled = true;
        DOM.btnPublish.title = '请先完成一键适配';
      }
    }
    
    // Export Button
    if (DOM.btnExportPkg) {
      if (state.unifiedPayload) {
        DOM.btnExportPkg.disabled = false;
        DOM.btnExportPkg.title = '导出发布资料(含JSON)';
      } else {
        DOM.btnExportPkg.disabled = true;
        DOM.btnExportPkg.title = '暂无可下载的发布资料';
      }
    }

    // Copy Payload Button
    if (DOM.btnCopyPayload) {
      DOM.btnCopyPayload.disabled = !state.unifiedPayload;
    }
  }

  // ========== 初始化渲染 ==========

  function renderPlatformSelector() {
    var platforms = Platforms?.getAllPlatforms() || [];
    if (!DOM.platformSelector) return;

    var html = '';
    platforms.forEach(function (p) {
      var icon = PLATFORM_ICONS[p.id] || PLATFORM_ICONS['default'];
      html += '<label class="platform-item" data-platform-id="' + p.id + '">';
      html += '  <input type="checkbox" value="' + p.id + '" style="display:none">';
      html += '  <div class="platform-icon">' + icon + '</div>';
      html += '  <div class="platform-info">';
      html += '    <div class="platform-name">' + p.name + '</div>';
      html += '  </div>';
      html += '  <div class="platform-check-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"></path></svg></div>';
      html += '</label>';
    });
    DOM.platformSelector.innerHTML = html;
  }

  // ========== 事件绑定 ==========

  function bindPlatformEvents() {
    if (!DOM.platformSelector) return;
    DOM.platformSelector.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') {
        var item = e.target.closest('.platform-item');
        if (item) {
          item.classList.toggle('selected', e.target.checked);
        }
        updateSelectedPlatforms();
      }
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
    updateButtonStates();
  }

  function bindInputCounters() {
    if (DOM.inputTitle && DOM.titleCounter) {
      DOM.inputTitle.addEventListener('input', function () {
        DOM.titleCounter.textContent = DOM.inputTitle.value.length + ' / 100';
        updateButtonStates();
      });
    }
    if (DOM.inputBody && DOM.bodyCounter) {
      DOM.inputBody.addEventListener('input', function () {
        var len = DOM.inputBody.value.length;
        DOM.bodyCounter.textContent = '字数统计: ' + len + ' 字';
        if (DOM.readTime) {
          DOM.readTime.textContent = '预计阅读: ' + Math.ceil(len / 300) + ' 分钟';
        }
        updateButtonStates();
      });
    }
  }

  function bindMediaUpload() {
    if (!DOM.inputMedia) return;
    DOM.inputMedia.addEventListener('change', function (e) {
      var files = e.target.files;
      if (!files || files.length === 0) return;

      var hasExistingVideo = state.mediaAssets.some(function(a) { return a.category === 'video'; });
      var hasExistingImage = state.mediaAssets.some(function(a) { return a.category === 'image'; });
      
      var newVideoCount = 0;
      var newImageCount = 0;
      for (var k = 0; k < files.length; k++) {
         if (files[k].type.startsWith('video/')) newVideoCount++;
         if (files[k].type.startsWith('image/')) newImageCount++;
      }

      // Rule 1: Video uniqueness and exclusion
      if (newVideoCount > 0) {
        if (newVideoCount > 1) {
          showToast('每次只能上传 1 个视频，多余视频将被忽略', 'warning');
        }
        if (hasExistingImage || newImageCount > 0) {
           showToast('图文与视频不可混发，已清空图片，仅保留视频', 'warning');
        }
        // Clear all
        state.mediaAssets.forEach(function(a) { if(a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
        state.mediaAssets = [];
        
        // Find the first video
        for (var i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('video/')) {
            addFileToAssets(files[i], 'video', i);
            break;
          }
        }
      } 
      // Rule 2: Image limit
      else if (newImageCount > 0) {
        if (hasExistingVideo) {
           showToast('图文与视频不可混发，已清空原视频，仅保留图片', 'warning');
           state.mediaAssets.forEach(function(a) { if(a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
           state.mediaAssets = [];
        }
        
        var availableSlots = 18 - state.mediaAssets.length;
        if (availableSlots <= 0) {
          showToast('最多只能上传 18 张图片', 'error');
          DOM.inputMedia.value = '';
          return;
        }

        if (newImageCount > availableSlots) {
           showToast('最多只能上传 18 张图片，超出的将被截断', 'warning');
        }

        var addedCount = 0;
        for (var j = 0; j < files.length; j++) {
          if (addedCount >= availableSlots) break;
          if (files[j].type.startsWith('image/')) {
            addFileToAssets(files[j], 'image', j);
            addedCount++;
          }
        }
      }

      renderMediaPreview();
      DOM.inputMedia.value = '';
      if (DOM.statMedia) DOM.statMedia.textContent = state.mediaAssets.length;
      updateButtonStates();
    });
  }

  function addFileToAssets(file, category, idx) {
    var previewUrl = '';
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      previewUrl = URL.createObjectURL(file);
    }
    state.mediaAssets.push({
      id: 'local-' + Date.now() + '-' + idx,
      name: file.name,
      type: file.type,
      size: file.size,
      category: category,
      source: 'local-preview',
      previewUrl: previewUrl
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

  function bindDemoButton() {
    if (DOM.btnFillDemo) {
      DOM.btnFillDemo.addEventListener('click', function() {
        if(DOM.inputTitle) DOM.inputTitle.value = 'AI 时代的内容创作者生存指南';
        if(DOM.inputBody) DOM.inputBody.value = '随着生成式 AI 的普及，内容创作的门槛大幅降低。创作者需要从“拼产量”转向“拼洞察”。本文将探讨在 AI 时代，如何利用好 AI 工具，同时保持个人特色和深度思考。\n\n第一，把 AI 当作副驾驶，而不是代笔。\n第二，建立个人的知识库和风格护城河。\n第三，关注读者真实需求和情感共鸣。';
        if(DOM.inputTags) DOM.inputTags.value = 'AI, 创作者, 效率, 思考';
        
        // Trigger input event
        if(DOM.inputTitle) DOM.inputTitle.dispatchEvent(new Event('input'));
        if(DOM.inputBody) DOM.inputBody.dispatchEvent(new Event('input'));
        
        showToast('已填入示例内容', 'info');
      });
    }
    
    if (DOM.btnViewConnector) {
      DOM.btnViewConnector.addEventListener('click', function() {
        if (DOM.connectorModal) DOM.connectorModal.style.display = 'flex';
      });
    }
  }

  function handleAdapt() {
    var title = DOM.inputTitle?.value?.trim() || '';
    var body = DOM.inputBody?.value || '';
    var tagsStr = DOM.inputTags?.value || '';

    var rawMessages = Validator?.validateRawContent(title, body, tagsStr, state.mediaAssets, state.selectedPlatforms) || [];
    var errorMsgs = rawMessages.filter(function (m) { return m.level === 'error'; });
    var hasError = errorMsgs.length > 0;
    
    if (hasError) {
      state.validationMessages = rawMessages;
      renderTabsAndPreviews([], rawMessages);
      showToast(errorMsgs[0].message, 'error', 5000);
      updateButtonStates();
      return;
    }

    var mediaStr = state.mediaAssets.length > 0 ? '已附加 ' + state.mediaAssets.length + ' 个素材' : '';
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

    updateButtonStates();

    // Build Payload
    if (Publisher && Publisher.buildPublishPayload) {
      state.unifiedPayload = Publisher.buildPublishPayload(state.unifiedContent, state.adaptedContents, 'payload', { mediaAssets: state.mediaAssets });
    }
    
    if (state.unifiedPayload && DOM.payloadCode) {
      DOM.payloadCode.textContent = JSON.stringify(state.unifiedPayload, null, 2);
    } else {
      if (DOM.payloadCode) DOM.payloadCode.textContent = '生成适配结果后，将自动生成标准 PublishPayload。';
    }
    updateButtonStates();

    // 更新顶部状态栏
    var statStatus = document.querySelector('.stat-status');
    if (statStatus) statStatus.textContent = '已生成预览';

    showToast('✅ 适配成功：已生成所有选中平台的预览内容！', 'success');
  }

  // ========== 中栏渲染：Tabs 与 预览 ==========

  function renderTabsAndPreviews(adaptedContents, messages) {
    if (!DOM.platformTabs || !DOM.tabContentArea) return;

    if (!adaptedContents || adaptedContents.length === 0) {
      DOM.platformTabs.innerHTML = '<div class="tab-empty-hint">请在左侧勾选平台</div>';
      var errHtml = renderValidationHtml(messages);
      var emptyHtml = '<div class="empty-card"><h3 class="empty-title">开始创建发布任务</h3><p class="empty-desc">填写内容、选择平台后，CreatorBridge 会生成各平台的适配预览和发布载荷。</p><div class="empty-steps"><div class="step-item">1. 填写标题和正文</div><div class="step-item">2. 选择至少一个发布平台</div><div class="step-item">3. 点击“一键适配”生成预览</div><div class="step-item">4. 点击“模拟发布”查看任务队列</div></div><div class="empty-actions"><button class="btn btn-primary btn-sm" id="btn-fill-demo">填写示例内容</button><button class="btn btn-ghost btn-sm" id="btn-view-connector">查看连接器说明</button></div></div>';
      DOM.tabContentArea.innerHTML = (errHtml ? '<div style="margin-bottom:20px;">' + errHtml + '</div>' : '') + '<div class="empty-state" id="preview-empty">' + emptyHtml + '</div>';
      bindDemoButton(); // Re-bind since we replaced innerHTML
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

  function bindTabWheelScroll() {
    if (DOM.platformTabs) {
      DOM.platformTabs.addEventListener('wheel', function(e) {
        // 当垂直滚动时(deltaY)，转化为水平滚动
        if (e.deltaY !== 0) {
          e.preventDefault();
          DOM.platformTabs.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
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

      var mode = state.connectorConfig.enabled ? 'connector' : 'mock';
      var baseUrl = state.connectorConfig.baseUrl;
      var token = state.runtimeToken;

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
          var modeStr = state.connectorConfig.enabled ? '连接器分发' : '模拟发布';
          showToast(modeStr + '流程结束', 'success');
        },
        mode, baseUrl, token
      );

      if (success) {
        Publisher.executeQueue();
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
      
      var retryBtn = task.status === 'failed' ? '<button class="btn btn-ghost btn-sm" onclick="Publisher.retryTask(\'' + task.taskId + '\')" style="margin-right:8px; padding:2px 6px; font-size:11px; border:1px solid var(--border-color);">重试</button>' : '';
      
      html += '  <div>' + retryBtn + '<span class="queue-status-badge queue-status-' + task.status + '">' + Utils.escapeHTML(task.message) + '</span></div>';
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

  // ========== 连接器设置模态框 ==========

  function initConnectorSettings() {
    var storedConfig = StorageMod?.getConnectorConfig ? StorageMod.getConnectorConfig() : { enabled: false, baseUrl: '' };
    state.connectorConfig.enabled = storedConfig.enabled;
    state.connectorConfig.baseUrl = storedConfig.baseUrl;
    
    updateModeBadge();

    if (DOM.btnSettings) {
      DOM.btnSettings.addEventListener('click', function() {
        // 打开时回显配置
        if (DOM.toggleConnector) DOM.toggleConnector.checked = state.connectorConfig.enabled;
        if (DOM.inputBaseUrl) DOM.inputBaseUrl.value = state.connectorConfig.baseUrl || '';
        if (DOM.inputRuntimeToken) DOM.inputRuntimeToken.value = state.runtimeToken || '';
        
        toggleInputs(state.connectorConfig.enabled);
        
        if (DOM.connectorModal) DOM.connectorModal.style.display = 'flex';
      });
    }

    if (DOM.btnCloseModal) {
      DOM.btnCloseModal.addEventListener('click', function() {
        if (DOM.connectorModal) DOM.connectorModal.style.display = 'none';
      });
    }

    if (DOM.toggleConnector) {
      DOM.toggleConnector.addEventListener('change', function(e) {
        toggleInputs(e.target.checked);
      });
    }

    if (DOM.btnTestConnection) {
      DOM.btnTestConnection.addEventListener('click', function() {
        var url = DOM.inputBaseUrl?.value?.trim() || '';
        if (!url || !url.startsWith('http')) {
          showToast('请输入合法的 Base URL (http/https 开头)', 'warning');
          return;
        }
        showToast('地址格式校验通过，正式请求将在投递环节执行。', 'info');
      });
    }

    if (DOM.btnSaveSettings) {
      DOM.btnSaveSettings.addEventListener('click', function() {
        var isEnabled = DOM.toggleConnector?.checked || false;
        var url = DOM.inputBaseUrl?.value?.trim() || '';
        var token = DOM.inputRuntimeToken?.value?.trim() || '';

        if (isEnabled && (!url || !url.startsWith('http'))) {
          showToast('启用连接器时，必须提供合法的 Base URL', 'error');
          return;
        }

        // 保存非敏感配置到本地
        state.connectorConfig.enabled = isEnabled;
        state.connectorConfig.baseUrl = url;
        if (StorageMod?.saveConnectorConfig) StorageMod.saveConnectorConfig(state.connectorConfig);
        
        // 敏感 Token 仅存内存
        state.runtimeToken = token;

        updateModeBadge();
        if (DOM.connectorModal) DOM.connectorModal.style.display = 'none';
        showToast('连接器配置已更新', 'success');
      });
    }
  }

  function toggleInputs(enabled) {
    if (DOM.inputBaseUrl) DOM.inputBaseUrl.disabled = !enabled;
    if (DOM.inputRuntimeToken) DOM.inputRuntimeToken.disabled = !enabled;
    if (DOM.btnTestConnection) DOM.btnTestConnection.disabled = !enabled;
  }

  function updateModeBadge() {
    if (!DOM.modeBadge) return;
    if (state.connectorConfig.enabled) {
      DOM.modeBadge.textContent = 'Connector 模式';
      DOM.modeBadge.className = 'badge'; // Reset classes
      DOM.modeBadge.style.background = 'rgba(59, 130, 246, 0.2)';
      DOM.modeBadge.style.color = '#93C5FD';
      DOM.modeBadge.style.border = '1px solid rgba(59, 130, 246, 0.4)';
    } else {
      DOM.modeBadge.textContent = 'Mock 模式';
      DOM.modeBadge.className = 'badge badge-mock';
      DOM.modeBadge.removeAttribute('style'); // Use original css
    }
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
    bindDemoButton();
    renderHistory();
    updateButtonStates(); // Init button states
    bindTabWheelScroll();
    initBackToTop();
    initConnectorSettings();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.App = {
    showToast: showToast,
    handleCopy: handleCopy
  };

})();
