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
    unifiedPayload: null // 新增：保存当前生成的发布载荷数据
  };

  // ========== 初始化 ==========

  /** 缓存 DOM 元素引用 */
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

    // 新增：载荷区相关 DOM 节点缓存
    DOM.btnCopyPayload = document.getElementById('btn-copy-payload');
    DOM.btnExportPayload = document.getElementById('btn-export-payload');
    DOM.payloadCode = document.getElementById('payload-code');
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
      html += '  <span class="platform-icon">' + p.icon + '</span>';
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

  /** 绑定清空按钮 */
  function bindClearButton() {
    if (!DOM.btnClear) return;
    DOM.btnClear.addEventListener('click', function () {
      if (DOM.inputTitle) DOM.inputTitle.value = '';
      if (DOM.inputBody) DOM.inputBody.value = '';
      if (DOM.inputTags) DOM.inputTags.value = '';
      if (DOM.inputMedia) DOM.inputMedia.value = '';
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
    var mediaStr = DOM.inputMedia?.value?.trim() || '';

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

    // 启用发布和导出按钮
    if (DOM.btnPublish) DOM.btnPublish.disabled = false;
    if (DOM.btnExport) DOM.btnExport.disabled = false;

    // 新增：构建标准统一发布载荷 (PublishPayload) 并渲染
    if (Publisher && Publisher.buildPublishPayload) {
      state.unifiedPayload = Publisher.buildPublishPayload(state.unifiedContent, state.adaptedContents, 'payload') || null;
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
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };

    var html = '';
    messages.forEach(function (msg) {
      var level = msg.level || 'info';
      var icon = iconMap[level] || 'ℹ️';
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
      var icon = platform?.icon || '📄';
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
        tipsHtml += '<div class="preview-tips-title">💡 发布建议</div>';
        content.tips.forEach(function (tip) {
          tipsHtml += '<div>• ' + (Utils?.escapeHTML(tip) || tip) + '</div>';
        });
        tipsHtml += '</div>';
      }

      html += '<div class="preview-card" data-platform-id="' + content.platformId + '">';

      // 卡片头部（平台标识）
      html += '  <div class="preview-card-header" style="background: ' + color + ';">';
      html += '    <span class="platform-icon">' + icon + '</span>';
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
      html += '      <span class="preview-stats">📊 约 ' + (content.estimatedLength || 0) + ' 字</span>';
      html += '      <button class="btn btn-copy btn-sm" data-copy-platform="' + content.platformId + '">📋 复制内容</button>';
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
          btnElement.textContent = '✅ 已复制';
          setTimeout(function () {
            btnElement.classList.remove('copied');
            btnElement.textContent = '📋 复制内容';
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
    if (!state.adaptedContents || state.adaptedContents.length === 0) {
      showToast('请先点击「一键适配」生成平台内容', 'warning');
      return;
    }

    // 检查是否有 error 级别错误
    var hasError = state.validationMessages.some(function (m) { return m.level === 'error'; });
    if (hasError) {
      showToast('存在必须修复的错误，请先处理后再发布', 'error');
      return;
    }

    // 调用模拟发布
    var title = state.unifiedContent?.title || '';
    var result = Publisher?.publishSelectedPlatforms(title, state.adaptedContents);

    if (!result) {
      showToast('模拟发布失败', 'error');
      return;
    }

    state.lastPublishResult = result;

    // 保存到发布历史
    StorageMod?.savePublishHistory(result);

    // 渲染发布结果
    renderPublishResult(result);

    // 更新发布历史
    renderHistory();

    showToast('模拟发布成功！批次号：' + result.batchId, 'success');

    // 滚动到发布结果区
    if (DOM.sectionPublishResult) {
      DOM.sectionPublishResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    html += '  <span class="result-icon">🎉</span>';
    html += '  <div class="result-info">';
    html += '    <h3>模拟发布成功</h3>';
    html += '    <p>批次号：' + (Utils?.escapeHTML(result.batchId) || result.batchId) + ' | 发布时间：' + (result.publishedAt || '') + ' | 模式：模拟发布</p>';
    html += '  </div>';
    html += '</div>';

    // 各平台发布状态
    html += '<div class="publish-platform-list">';
    if (result.platforms && result.platforms.length > 0) {
      result.platforms.forEach(function (p) {
        var platform = Platforms?.getPlatformById(p.platformId);
        var icon = platform?.icon || '📄';
        html += '<div class="publish-platform-item">';
        html += '  <span class="pub-icon">' + icon + '</span>';
        html += '  <span class="pub-name">' + (Utils?.escapeHTML(p.platformName) || p.platformName) + '</span>';
        html += '  <span class="pub-status success">' + (Utils?.escapeHTML(p.message) || p.message) + '</span>';
        html += '  <span class="pub-badge success">✅ 成功</span>';
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
      html += '  <span class="history-time">🕐 ' + (record.publishedAt || '') + '</span>';
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
          DOM.btnCopyPayload.innerHTML = '✅ 已复制';
          setTimeout(function () {
            DOM.btnCopyPayload.innerHTML = '📋 复制 Payload';
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
    var iconMap = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (iconMap[type] || 'ℹ️') + '</span>' +
      '<span>' + (Utils?.escapeHTML(message) || message) + '</span>';
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
    renderHistory();
    console.log('CreatorBridge 初始化完成 ✓');
  }

  document.addEventListener('DOMContentLoaded', init);

  // 暴露全局方法
  window.App = {
    showToast: showToast,
    getState: function () { return state; }
  };

})();
