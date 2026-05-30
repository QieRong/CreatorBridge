/**
 * CreatorBridge - 主入口模块
 * 负责页面初始化、事件绑定、流程调度
 * 
 * 核心流程：
 * 1. 读取用户输入 → 2. 创建统一内容 → 3. 调用适配器 →
 * 4. 格式校验 → 5. 渲染预览 → 6. 模拟发布 → 7. 保存历史
 */

;(function () {
  'use strict';

  // 依赖模块引用
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
    lastPublishResult: null,
    unifiedPayload: null, // 新增：保存当前生成的发布载荷数据
    mediaAssets: [] // 新增：保存本地素材元数据和预览URL
  };

  // ========== 初始化 ==========

  /** 缓存 DOM 元素引用 */
  function cacheDOM() {
    DOM.inputTitle = document.getElementById('input-title');
    DOM.inputBody = document.getElementById('input-body');
    DOM.inputTags = document.getElementById('input-tags');
    DOM.inputMedia = document.getElementById('input-media');
    DOM.mediaCountHint = document.getElementById('media-count-hint');
    DOM.mediaPreviewContainer = document.getElementById('media-preview-container');
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
    DOM.sectionQueue = document.getElementById('section-queue');
    DOM.queueList = document.getElementById('queue-list');
    DOM.sectionPublishResult = document.getElementById('section-publish-result');
    DOM.sectionHistory = document.getElementById('section-history');
    DOM.validationList = document.getElementById('validation-list');
    DOM.previewGrid = document.getElementById('preview-grid');
    DOM.publishResultCard = document.getElementById('publish-result-card');
    DOM.historyList = document.getElementById('history-list');
    DOM.historyEmpty = document.getElementById('history-empty');
    DOM.toastContainer = document.getElementById('toast-container');

    // 新增：载荷区相关 DOM 节点缓存
    DOM.btnCopyPayload = document.getElementById('btn-copy-payload');
    DOM.btnExportPayload = document.getElementById('btn-export-payload');
    DOM.payloadCode = document.getElementById('payload-code');

    // 新增：发布模式与连接器相关 DOM 缓存
    DOM.connectorPanel = document.getElementById('connector-panel');
    DOM.connectorUrl = document.getElementById('connector-url');
    DOM.headerBadge = document.querySelector('.header-badge .badge');
  }

  /** 渲染平台选择器 */
  function renderPlatformSelector() {
    var platforms = Platforms?.getAllPlatforms() || [];
    if (!DOM.platformSelector) return;

    var html = '';
    platforms.forEach(function (p) {
      html += '<label class="platform-item" data-platform-id="' + p.id + '">';
      html += '  <input type="checkbox" value="' + p.id + '">';
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

  /** 绑定平台选择事件 */
  function bindPlatformEvents() {
    if (!DOM.platformSelector) return;
    DOM.platformSelector.addEventListener('click', function (e) {
      var item = e.target.closest('.platform-item');
      if (!item) return;
      var checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
      updateSelectedPlatforms();
    });
  }

  /** 更新选中平台列表 */
  function updateSelectedPlatforms() {
    var checkboxes = DOM.platformSelector?.querySelectorAll('input[type="checkbox"]:checked') || [];
    state.selectedPlatforms = [];
    checkboxes.forEach(function (cb) {
      state.selectedPlatforms.push(cb.value);
    });
  }

  /** 绑定输入框字数统计 */
  function bindInputCounters() {
    if (DOM.inputTitle && DOM.titleCounter) {
      DOM.inputTitle.addEventListener('input', function () {
        DOM.titleCounter.textContent = DOM.inputTitle.value.length + ' / 100';
      });
    }
    if (DOM.inputBody && DOM.bodyCounter) {
      DOM.inputBody.addEventListener('input', function () {
        DOM.bodyCounter.textContent = DOM.inputBody.value.length + ' 字';
      });
    }
  }

  /** 绑定素材上传事件 */
  function bindMediaUpload() {
    if (!DOM.inputMedia) return;
    DOM.inputMedia.addEventListener('change', function (e) {
      var files = e.target.files;
      if (!files || files.length === 0) return;

      // 追加新文件到 mediaAssets
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        
        // 生成本地预览URL
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
      
      // 不清空 file input 的 value，以便允许继续选择，或者为了避免选择同一文件时不触发 change，清空 value
      DOM.inputMedia.value = '';
    });
  }

  /** 渲染素材预览区 */
  function renderMediaPreview() {
    if (!DOM.mediaPreviewContainer || !DOM.mediaCountHint) return;
    
    DOM.mediaCountHint.textContent = '已选择 ' + state.mediaAssets.length + ' 个文件';
    
    var html = '';
    state.mediaAssets.forEach(function (asset) {
      html += '<div class="media-preview-item" title="' + Utils.escapeHTML(asset.name) + '">';
      if (asset.category === 'image') {
        html += '  <img src="' + asset.previewUrl + '" alt="' + Utils.escapeHTML(asset.name) + '">';
      } else if (asset.category === 'video') {
        html += '  <video src="' + asset.previewUrl + '" muted></video>';
      }
      html += '  <span class="media-type-badge">' + (asset.category === 'image' ? '图' : '视') + '</span>';
      html += '</div>';
    });
    
    DOM.mediaPreviewContainer.innerHTML = html;
  }

  /** 绑定清空按钮 */
  function bindClearButton() {
    if (!DOM.btnClear) return;
    DOM.btnClear.addEventListener('click', function () {
      if (DOM.inputTitle) DOM.inputTitle.value = '';
      if (DOM.inputBody) DOM.inputBody.value = '';
      if (DOM.inputTags) DOM.inputTags.value = '';
      if (DOM.inputMedia) DOM.inputMedia.value = '';
      if (DOM.mediaCountHint) DOM.mediaCountHint.textContent = '未选择文件';
      if (DOM.mediaPreviewContainer) DOM.mediaPreviewContainer.innerHTML = '';
      
      // 清理对象 URL
      state.mediaAssets.forEach(function(asset) {
        if (asset.previewUrl) {
          URL.revokeObjectURL(asset.previewUrl);
        }
      });
      state.mediaAssets = [];
      if (DOM.titleCounter) DOM.titleCounter.textContent = '0 / 100';
      if (DOM.bodyCounter) DOM.bodyCounter.textContent = '0 字';

      var items = DOM.platformSelector?.querySelectorAll('.platform-item') || [];
      items.forEach(function (item) {
        item.classList.remove('selected');
        var cb = item.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      });
      state.selectedPlatforms = [];
      state.unifiedContent = null;
      state.adaptedContents = [];
      state.validationMessages = [];
      state.lastPublishResult = null;

      if (DOM.sectionValidation) DOM.sectionValidation.style.display = 'none';
      if (DOM.sectionPreview) DOM.sectionPreview.style.display = 'none';
      if (DOM.sectionQueue) DOM.sectionQueue.style.display = 'none';
      if (DOM.sectionPublishResult) DOM.sectionPublishResult.style.display = 'none';
      if (DOM.btnPublish) DOM.btnPublish.disabled = true;
      if (DOM.btnExport) DOM.btnExport.disabled = true;

      // 新增：重置载荷区状态
      if (DOM.btnCopyPayload) DOM.btnCopyPayload.disabled = true;
      if (DOM.btnExportPayload) DOM.btnExportPayload.disabled = true;
      if (DOM.payloadCode) DOM.payloadCode.textContent = '请先完成一键适配，以生成标准发布载荷。';
      state.unifiedPayload = null;

      showToast('已清空所有输入内容', 'info');
    });
  }

  // ========== 核心流程：一键适配 ==========

  /** 绑定一键适配按钮 */
  function bindAdaptButton() {
    if (!DOM.btnAdapt) return;
    DOM.btnAdapt.addEventListener('click', handleAdapt);
  }

  /** 处理一键适配 */
  function handleAdapt() {
    var title = DOM.inputTitle?.value?.trim() || '';
    var body = DOM.inputBody?.value || '';
    var tagsStr = DOM.inputTags?.value || '';
    // 素材改为结构化数据传递
    var mediaStr = state.mediaAssets.length > 0 ? ('已选择 ' + state.mediaAssets.length + ' 个素材') : '';

    // 第一步：原始内容校验
    var rawMessages = Validator?.validateRawContent(title, body, tagsStr, mediaStr, state.selectedPlatforms) || [];

    // 如果有 error 级别的错误，显示校验结果后中止
    var hasError = rawMessages.some(function (m) { return m.level === 'error'; });
    if (hasError) {
      state.validationMessages = rawMessages;
      renderValidation(rawMessages);
      showToast('请先修复标红的错误项', 'error');
      // 隐藏预览区
      if (DOM.sectionPreview) DOM.sectionPreview.style.display = 'none';
      if (DOM.btnPublish) DOM.btnPublish.disabled = true;
      if (DOM.btnExport) DOM.btnExport.disabled = true;
      return;
    }

    // 第二步：拆分标签
    var tags = Utils?.splitTags(tagsStr) || [];

    // 第三步：构建素材信息
    var media = [];
    if (mediaStr) {
      media.push({ type: 'link', url: mediaStr, description: mediaStr });
    }

    // 第四步：创建统一内容模型
    state.unifiedContent = Models?.createUnifiedContent(title, body, tags, media) || {
      id: 'content_' + Date.now(),
      title: title,
      body: body,
      tags: tags,
      media: media
    };

    // 第五步：调用平台适配器
    state.adaptedContents = Adapters?.adaptContentForSelectedPlatforms(state.selectedPlatforms, state.unifiedContent) || [];

    // 第六步：对适配后内容进行校验
    var adaptedMessages = Validator?.validateAdaptedContent(state.adaptedContents) || [];

    // 合并校验消息（原始校验的 info 消息 + 适配后校验消息）
    var infoMessages = rawMessages.filter(function (m) { return m.level === 'info'; });
    state.validationMessages = infoMessages.concat(adaptedMessages);

    // 第七步：渲染结果
    renderValidation(state.validationMessages);
    renderPreview(state.adaptedContents);

    // 启用发布和导出按钮（若存在 error 级别错误则禁用发布按钮，确保流程合理性）
    var hasError = state.validationMessages.some(function (m) { return m.level === 'error'; });
    if (DOM.btnPublish) DOM.btnPublish.disabled = hasError;
    if (DOM.btnExport) DOM.btnExport.disabled = false;

    // 新增：构建标准统一发布载荷 (PublishPayload) 并渲染
    if (Publisher && Publisher.buildPublishPayload) {
      var payloadOptions = { mediaAssets: state.mediaAssets };
      state.unifiedPayload = Publisher.buildPublishPayload(state.unifiedContent, state.adaptedContents, 'payload', payloadOptions) || null;
    }
    if (state.unifiedPayload && DOM.payloadCode) {
      DOM.payloadCode.textContent = JSON.stringify(state.unifiedPayload, null, 2);
      if (DOM.btnCopyPayload) DOM.btnCopyPayload.disabled = false;
      if (DOM.btnExportPayload) DOM.btnExportPayload.disabled = false;
    } else {
      if (DOM.payloadCode) DOM.payloadCode.textContent = '载荷生成失败，请重试。';
      if (DOM.btnCopyPayload) DOM.btnCopyPayload.disabled = true;
      if (DOM.btnExportPayload) DOM.btnExportPayload.disabled = true;
    }

    showToast('已成功适配 ' + state.adaptedContents.length + ' 个平台', 'success');

    // 滚动到预览区
    if (DOM.sectionPreview) {
      DOM.sectionPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ========== 渲染：格式检查 ==========

  /** 渲染校验结果列表 */
  function renderValidation(messages) {
    if (!DOM.validationList || !DOM.sectionValidation) return;

    if (!messages || messages.length === 0) {
      DOM.sectionValidation.style.display = 'none';
      return;
    }

    DOM.sectionValidation.style.display = '';

    var iconMap = {
      error: '[错误]',
      warning: '[建议]',
      info: '[提示]',
      success: '[通过]'
    };

    var html = '';
    messages.forEach(function (msg) {
      var level = msg.level || 'info';
      var icon = iconMap[level] || '[提示]';
      var platformTag = msg.platform && msg.platform !== '通用'
        ? ' <span class="text-muted">[' + (Utils?.escapeHTML(msg.platform) || msg.platform) + ']</span>'
        : '';
      html += '<div class="validation-item ' + level + '">';
      html += '  <span class="validation-icon">' + icon + '</span>';
      html += '  <span class="validation-text">' + (Utils?.escapeHTML(msg.message) || msg.message) + platformTag + '</span>';
      html += '</div>';
    });

    DOM.validationList.innerHTML = html;
  }

  // ========== 渲染：多平台预览 ==========

  /** 渲染预览卡片 */
  function renderPreview(adaptedContents) {
    if (!DOM.previewGrid || !DOM.sectionPreview) return;

    if (!adaptedContents || adaptedContents.length === 0) {
      DOM.sectionPreview.style.display = 'none';
      return;
    }

    DOM.sectionPreview.style.display = '';

    var html = '';
    adaptedContents.forEach(function (content) {
      var platform = Platforms?.getPlatformById(content.platformId);
      var color = platform?.color || '#4F46E5';
      var desc = platform?.description || '';

      // 标签渲染
      var tagsHtml = '';
      if (content.tags && content.tags.length > 0) {
        content.tags.forEach(function (tag) {
          tagsHtml += '<span class="preview-tag" style="background:' + color + '15; color:' + color + ';">' +
            (Utils?.escapeHTML(tag) || tag) + '</span>';
        });
      }

      // 发布建议渲染
      var tipsHtml = '';
      if (content.tips && content.tips.length > 0) {
        tipsHtml += '<div class="preview-tips">';
        tipsHtml += '<div class="preview-tips-title">发布建议</div>';
        content.tips.forEach(function (tip) {
          tipsHtml += '<div>• ' + (Utils?.escapeHTML(tip) || tip) + '</div>';
        });
        tipsHtml += '</div>';
      }

      html += '<div class="preview-card" data-platform-id="' + content.platformId + '">';

      // 卡片头部（平台标识）
      html += '  <div class="preview-card-header" style="background: ' + color + ';">';
      html += '    <div class="platform-info">';
      html += '      <div class="platform-name">' + (Utils?.escapeHTML(content.platformName) || content.platformName) + '</div>';
      html += '      <div class="platform-desc">' + (Utils?.escapeHTML(desc) || desc) + '</div>';
      html += '    </div>';
      html += '  </div>';

      // 卡片内容
      html += '  <div class="preview-card-body">';
      html += '    <div class="preview-title">' + (Utils?.escapeHTML(content.title) || content.title) + '</div>';
      html += '    <div class="preview-body">' + (Utils?.escapeHTML(content.body) || content.body) + '</div>';

      if (tagsHtml) {
        html += '    <div class="preview-tags">' + tagsHtml + '</div>';
      }

      // 统计和复制
      html += '    <div class="preview-meta">';
      html += '      <span class="preview-stats">字数估算: ' + (content.estimatedLength || 0) + ' 字</span>';
      html += '      <button class="btn btn-copy btn-sm" data-copy-platform="' + content.platformId + '">复制内容</button>';
      html += '    </div>';

      html += tipsHtml;
      html += '  </div>';
      html += '</div>';
    });

    DOM.previewGrid.innerHTML = html;

    // 绑定复制按钮事件
    bindCopyButtons();
  }

  // ========== 复制功能 ==========

  /** 绑定预览卡片中的复制按钮 */
  function bindCopyButtons() {
    var buttons = DOM.previewGrid?.querySelectorAll('[data-copy-platform]') || [];
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var platformId = btn.getAttribute('data-copy-platform');
        handleCopy(platformId, btn);
      });
    });
  }

  /** 处理复制操作 */
  function handleCopy(platformId, btnElement) {
    // 查找对应平台的适配内容
    var content = state.adaptedContents.find(function (c) {
      return c.platformId === platformId;
    });
    if (!content) {
      showToast('未找到该平台的适配内容', 'error');
      return;
    }

    // 组装复制文本（按 AGENTS.md 第 15.5 节规范）
    var copyText = '';
    copyText += '【' + content.platformName + '】\n\n';
    copyText += '标题：' + content.title + '\n\n';
    copyText += '正文：\n' + content.body + '\n\n';
    if (content.tags && content.tags.length > 0) {
      copyText += '标签：' + content.tags.join('、') + '\n\n';
    }
    if (content.tips && content.tips.length > 0) {
      copyText += '发布建议：\n';
      content.tips.forEach(function (tip) {
        copyText += '• ' + tip + '\n';
      });
    }

    // 调用剪贴板 API
    var copyPromise = Utils?.copyToClipboard(copyText);
    if (copyPromise && typeof copyPromise.then === 'function') {
      copyPromise.then(function () {
        showToast(content.platformName + ' 内容已复制到剪贴板', 'success');
        // 按钮状态反馈
        if (btnElement) {
          btnElement.classList.add('copied');
          btnElement.textContent = '已复制';
          setTimeout(function () {
            btnElement.classList.remove('copied');
            btnElement.textContent = '复制内容';
          }, 2000);
        }
      }).catch(function () {
        showToast('复制失败，请手动复制', 'error');
      });
    }
  }

  // ========== 模拟发布 ==========

  /** 绑定模拟发布按钮 */
  function bindPublishButton() {
    if (!DOM.btnPublish) return;
    DOM.btnPublish.addEventListener('click', handlePublish);
  }

  /** 处理模拟发布 */
  function handlePublish() {
    // 检查是否已有适配结果
    if (!state.unifiedPayload) {
      showToast('请先点击「一键适配」生成载荷', 'warning');
      return;
    }

    // 检查是否有 error 级别错误
    var hasError = state.validationMessages.some(function (m) { return m.level === 'error'; });
    if (hasError) {
      showToast('存在必须修复的错误，请先处理后再发布', 'error');
      return;
    }

    // 调用任务队列
    if (DOM.sectionPublishResult) DOM.sectionPublishResult.style.display = 'none';
    if (DOM.sectionQueue) DOM.sectionQueue.style.display = 'block';
    
    // 创建队列
    var success = Publisher.createTaskQueue(
      state.unifiedPayload,
      function onProgress(tasks) {
        renderQueue(tasks);
      },
      function onComplete(batchId, tasks) {
        // 完成后组装结果并保存
        var title = state.unifiedContent?.title || '无标题';
        var platforms = tasks.map(function(t) {
          return {
            platformId: t.platformId,
            platformName: t.platformName,
            status: t.status,
            message: t.message
          };
        });
        
        var result = Models.createPublishResult(batchId, title, platforms);
        state.lastPublishResult = result;
        StorageMod?.savePublishHistory(result);
        renderPublishResult(result);
        renderHistory();
        
        var hasFailures = tasks.some(function(t) { return t.status === 'failed'; });
        if (hasFailures) {
          showToast('模拟发布完成，但有部分任务失败', 'warning');
        } else {
          showToast('模拟发布全部成功！', 'success');
        }
        
        if (DOM.sectionPublishResult) {
          DOM.sectionPublishResult.style.display = 'block';
        }
      }
    );

    if (success) {
      if (DOM.sectionQueue) {
        DOM.sectionQueue.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 初次渲染
      renderQueue(Publisher.getTasks ? Publisher.getTasks() : []);
      // 启动
      Publisher.runQueue();
    } else {
      showToast('队列创建失败', 'error');
    }
  }

  /** 渲染任务队列 */
  function renderQueue(tasks) {
    if (!DOM.queueList) return;
    
    // 如果 publisher 暴露了 getTasks，但是回调里已经传了，直接用
    if (!tasks) return;
    
    var html = '';
    tasks.forEach(function(task) {
      html += '<div class="queue-item">';
      html += '  <div class="queue-item-info">';
      html += '    <div class="queue-item-title">' + Utils.escapeHTML(task.platformName) + '</div>';
      html += '    <div class="queue-item-desc">目标: ' + Utils.escapeHTML(task.payloadSummary.title) + '</div>';
      html += '  </div>';
      html += '  <div class="queue-item-status">';
      html += '    <span class="queue-status-badge queue-status-' + task.status + '">' + Utils.escapeHTML(task.message) + '</span>';
      if (task.status === 'failed') {
        html += '    <button class="btn btn-outline btn-sm" onclick="App.retryTask(\'' + task.taskId + '\')">重试</button>';
      }
      html += '  </div>';
      html += '</div>';
    });
    
    DOM.queueList.innerHTML = html;
  }

  // ========== 渲染：发布结果 ==========

  /** 渲染模拟发布结果 */
  function renderPublishResult(result) {
    if (!DOM.publishResultCard || !DOM.sectionPublishResult) return;
    if (!result) {
      DOM.sectionPublishResult.style.display = 'none';
      return;
    }

    DOM.sectionPublishResult.style.display = '';

    var html = '';
    // 发布结果头部
    html += '<div class="publish-result-header">';
    html += '  <div class="result-info">';
    html += '    <h3>模拟发布成功</h3>';
    html += '    <p>批次号：' + (Utils?.escapeHTML(result.batchId) || result.batchId) + ' | 发布时间：' + (result.publishedAt || '') + ' | 模式：模拟发布</p>';
    html += '  </div>';
    html += '</div>';

    // 各平台发布状态
    html += '<div class="publish-platform-list">';
    if (result.platforms && result.platforms.length > 0) {
      result.platforms.forEach(function (p) {
        html += '<div class="publish-platform-item">';
        html += '  <span class="pub-name">' + (Utils?.escapeHTML(p.platformName) || p.platformName) + '</span>';
        html += '  <span class="pub-status success">' + (Utils?.escapeHTML(p.message) || p.message) + '</span>';
        html += '  <span class="pub-badge success">成功</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    DOM.publishResultCard.innerHTML = html;
  }

  // ========== 渲染：发布历史 ==========

  /** 渲染发布历史列表 */
  function renderHistory() {
    if (!DOM.historyList) return;

    var history = StorageMod?.getPublishHistory() || [];

    if (history.length === 0) {
      DOM.historyList.innerHTML = '<div class="empty-state" id="history-empty">' +
        '<span class="empty-icon">📭</span>' +
        '<p>暂无发布历史记录</p></div>';
      return;
    }

    var html = '';
    history.forEach(function (record) {
      // 平台标签
      var platformTags = '';
      if (record.platforms && record.platforms.length > 0) {
        record.platforms.forEach(function (p) {
          var platform = Platforms?.getPlatformById(p.platformId);
          var color = platform?.color || '#4F46E5';
          platformTags += '<span class="history-platform-tag" style="background:' + color + ';">' +
            (Utils?.escapeHTML(p.platformName) || p.platformName) + '</span>';
        });
      }

      html += '<div class="history-item">';
      html += '  <span class="history-batch">' + (Utils?.escapeHTML(record.batchId) || record.batchId) + '</span>';
      html += '  <span class="history-title">' + (Utils?.escapeHTML(record.title) || record.title) + '</span>';
      html += '  <div class="history-platforms">' + platformTags + '</div>';
      html += '  <span class="history-time">' + (record.publishedAt || '') + '</span>';
      html += '  <span class="history-status success">模拟发布</span>';
      html += '</div>';
    });

    DOM.historyList.innerHTML = html;
  }

  // ========== 导出功能 ==========

  /** 绑定导出按钮 */
  function bindExportButton() {
    if (!DOM.btnExport) return;
    DOM.btnExport.addEventListener('click', handleExport);
  }

  /** 处理导出全部内容 */
  function handleExport() {
    if (!state.adaptedContents || state.adaptedContents.length === 0) {
      showToast('请先点击「一键适配」生成平台内容', 'warning');
      return;
    }

    var exportText = '=== CreatorBridge 多平台适配内容 ===\n';
    exportText += '导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
    exportText += '原始标题：' + (state.unifiedContent?.title || '') + '\n';
    exportText += '==========================================\n\n';

    state.adaptedContents.forEach(function (content) {
      exportText += '【' + content.platformName + '】\n';
      exportText += '标题：' + content.title + '\n';
      exportText += '正文：\n' + content.body + '\n';
      if (content.tags && content.tags.length > 0) {
        exportText += '标签：' + content.tags.join('、') + '\n';
      }
      exportText += '\n------------------------------------------\n\n';
    });

    var filename = 'CreatorBridge_导出_' + new Date().toISOString().slice(0, 10) + '.txt';
    Utils?.downloadTextFile(filename, exportText);
    showToast('内容已导出为 ' + filename, 'success');
  }

  // ========== Payload 载荷交互 ==========

  /** 处理复制 Payload JSON */
  function handleCopyPayload() {
    if (!state.unifiedPayload) {
      showToast('无可用载荷数据', 'warning');
      return;
    }
    var jsonText = JSON.stringify(state.unifiedPayload, null, 2);
    var copyPromise = Utils?.copyToClipboard(jsonText);
    if (copyPromise && typeof copyPromise.then === 'function') {
      copyPromise.then(function () {
        showToast('发布载荷 JSON 已复制到剪贴板', 'success');
        if (DOM.btnCopyPayload) {
          DOM.btnCopyPayload.innerHTML = '已复制';
          setTimeout(function () {
            DOM.btnCopyPayload.innerHTML = '复制 Payload';
          }, 2000);
        }
      }).catch(function () {
        showToast('复制失败，请手动选择复制', 'error');
      });
    } else {
      showToast('当前浏览器不支持自动复制，请手动复制', 'warning');
    }
  }

  /** 处理导出 Payload JSON */
  function handleExportPayload() {
    if (!state.unifiedPayload) {
      showToast('无可用载荷数据', 'warning');
      return;
    }
    var jsonText = JSON.stringify(state.unifiedPayload, null, 2);
    
    // 格式化时间戳 YYYYMMDD-HHMMSS
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var date = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var timestamp = year + month + date + '-' + hours + minutes + seconds;
    
    var filename = 'creatorbridge-payload-' + timestamp + '.json';
    Utils?.downloadTextFile(filename, jsonText);
    showToast('载荷已成功导出为 ' + filename, 'success');
  }

  /** 绑定 Payload 相关交互事件 */
  function bindPayloadEvents() {
    if (DOM.btnCopyPayload) {
      DOM.btnCopyPayload.addEventListener('click', handleCopyPayload);
    }
    if (DOM.btnExportPayload) {
      DOM.btnExportPayload.addEventListener('click', handleExportPayload);
    }
  }

  /** 绑定发布模式切换事件 */
  function bindModeEvents() {
    var radios = document.querySelectorAll('input[name="publish-mode"]');
    var options = document.querySelectorAll('.mode-option');
    if (radios.length === 0) return;

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        // 1. 更新选中卡片的 active 激活样式
        options.forEach(function (opt) {
          var isCurrent = opt.getAttribute('data-mode') === radio.value;
          opt.classList.toggle('active', isCurrent);
        });

        // 2. 控制 Connector 面板显示/隐藏
        if (DOM.connectorPanel) {
          DOM.connectorPanel.style.display = radio.value === 'connector' ? 'block' : 'none';
        }

        // 3. 联动更新顶部 Header Badge
        if (DOM.headerBadge) {
          if (radio.value === 'mock') {
            DOM.headerBadge.className = 'badge badge-mock';
            DOM.headerBadge.style.background = '';
            DOM.headerBadge.style.color = '';
            DOM.headerBadge.style.border = '';
            DOM.headerBadge.textContent = '模拟发布模式';
          } else if (radio.value === 'payload') {
            DOM.headerBadge.className = 'badge';
            DOM.headerBadge.style.background = 'rgba(255,255,255,0.2)';
            DOM.headerBadge.style.color = '#fff';
            DOM.headerBadge.style.border = '1px solid rgba(255,255,255,0.25)';
            DOM.headerBadge.textContent = 'Payload 导出模式';
          } else if (radio.value === 'connector') {
            DOM.headerBadge.className = 'badge';
            DOM.headerBadge.style.background = 'rgba(255,255,255,0.2)';
            DOM.headerBadge.style.color = '#fff';
            DOM.headerBadge.style.border = '1px solid rgba(255,255,255,0.25)';
            DOM.headerBadge.textContent = '连接器预留模式';
          }
        }
      });
    });
  }

  // ========== 清空历史 ==========

  /** 绑定清空历史按钮 */
  function bindClearHistoryButton() {
    if (!DOM.btnClearHistory) return;
    DOM.btnClearHistory.addEventListener('click', function () {
      var history = StorageMod?.getPublishHistory() || [];
      if (history.length === 0) {
        showToast('当前没有发布历史记录', 'info');
        return;
      }
      StorageMod?.clearPublishHistory();
      renderHistory();
      showToast('发布历史已清空', 'success');
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

    // 连击去重防刷：使用 textContent.trim() 确保在同一个 Event Loop 或未完成 Layout 渲染时也能精准匹配去重
    if (DOM.toastContainer) {
      var activeToasts = DOM.toastContainer.querySelectorAll('.toast');
      for (var i = 0; i < activeToasts.length; i++) {
        var toastText = activeToasts[i].textContent || activeToasts[i].innerText || '';
        if (toastText.trim() === message.trim()) {
          return; // 已有相同 Toast 展现，直接去重返回
        }
      }
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span>' + (Utils?.escapeHTML(message) || message) + '</span>';
    if (DOM.toastContainer) {
      DOM.toastContainer.appendChild(toast);
    }
    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  // ========== 应用入口 ==========

  function init() {
    console.log('CreatorBridge v1.0 初始化中...');
    cacheDOM();
    renderPlatformSelector();
    bindPlatformEvents();
    bindInputCounters();
    bindClearButton();
    bindAdaptButton();
    bindPublishButton();
    bindExportButton();
    bindClearHistoryButton();
    bindPayloadEvents(); // 新增：绑定载荷交互事件
    bindModeEvents(); // 新增：绑定发布模式切换事件
    bindMediaUpload(); // 新增：绑定本地素材上传事件
    renderHistory();
    console.log('CreatorBridge 初始化完成 ✓');
  }

  document.addEventListener('DOMContentLoaded', init);

  // 暴露全局方法
  window.App = {
    showToast: showToast,
    getState: function () { return state; },
    retryTask: function(taskId) {
      if (Publisher && Publisher.retryTask) {
        Publisher.retryTask(taskId);
      }
    }
  };

})();
