/**
 * CreatorBridge - 通用工具函数模块
 * 提供项目中多处复用的基础工具方法
 * 包括：时间格式化、文本处理、剪贴板、文件下载等
 */

(function () {
  'use strict';

  /**
   * 格式化日期为 'YYYY-MM-DD HH:mm:ss' 格式
   * 如果入参无效则使用当前时间
   *
   * @param {Date|string|number} date - 日期对象、时间字符串或时间戳
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(date) {
    var d;

    // 防御性处理：尝试解析入参为有效 Date 对象
    if (date instanceof Date && !isNaN(date.getTime())) {
      d = date;
    } else if (date != null) {
      d = new Date(date);
      // 如果解析失败，使用当前时间
      if (isNaN(d.getTime())) {
        d = new Date();
      }
    } else {
      d = new Date();
    }

    var year = d.getFullYear();
    var month = padZero(d.getMonth() + 1);
    var day = padZero(d.getDate());
    var hours = padZero(d.getHours());
    var minutes = padZero(d.getMinutes());
    var seconds = padZero(d.getSeconds());

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
  }

  /**
   * 数字补零，确保两位显示
   *
   * @param {number} num - 需要补零的数字
   * @returns {string} 补零后的字符串
   */
  function padZero(num) {
    return num < 10 ? '0' + num : String(num);
  }

  /**
   * 计算文本字符数（排除首尾空白）
   *
   * @param {string} text - 待计算的文本
   * @returns {number} 字符数
   */
  function countTextLength(text) {
    if (text == null) {
      return 0;
    }
    return String(text).trim().length;
  }

  /**
   * 拆分标签字符串为数组
   * 支持中英文逗号和空格作为分隔符
   * 自动去重、去除空白标签
   *
   * @param {string} tagString - 标签字符串，如 '学习,效率工具，内容创作 分享'
   * @returns {string[]} 去重后的标签数组
   */
  function splitTags(tagString) {
    if (tagString == null || String(tagString).trim() === '') {
      return [];
    }

    var text = String(tagString);

    // 将中文逗号和空格统一替换为英文逗号，再按英文逗号拆分
    var raw = text
      .replace(/，/g, ',')
      .replace(/\s+/g, ',')
      .split(',');

    // 去除空白项并 trim
    var trimmed = [];
    for (var i = 0; i < raw.length; i++) {
      var tag = raw[i].trim();
      if (tag !== '') {
        trimmed.push(tag);
      }
    }

    // 去重：利用对象键唯一性
    var seen = {};
    var unique = [];
    for (var j = 0; j < trimmed.length; j++) {
      if (!seen[trimmed[j]]) {
        seen[trimmed[j]] = true;
        unique.push(trimmed[j]);
      }
    }

    return unique;
  }

  /**
   * 复制文本到剪贴板
   * 优先使用 Clipboard API，不支持时降级为 execCommand
   *
   * @param {string} text - 要复制的文本
   * @returns {Promise<boolean>} 复制是否成功
   */
  function copyToClipboard(text) {
    var safeText = (text != null) ? String(text) : '';

    // 优先使用现代 Clipboard API
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(safeText)
        .then(function () {
          return true;
        })
        .catch(function () {
          // Clipboard API 失败时尝试降级方案
          return fallbackCopy(safeText);
        });
    }

    // 降级方案：使用临时 textarea + execCommand
    return Promise.resolve(fallbackCopy(safeText));
  }

  /**
   * 降级复制方案：通过创建临时 textarea 元素实现
   *
   * @param {string} text - 要复制的文本
   * @returns {boolean} 复制是否成功
   */
  function fallbackCopy(text) {
    try {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      // 移出可视区域，避免页面闪烁
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      var result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    } catch (e) {
      return false;
    }
  }

  /**
   * 下载文本文件
   * 使用 Blob 和 URL.createObjectURL 触发浏览器下载
   *
   * @param {string} filename - 文件名，如 'report.txt'
   * @param {string} content - 文件内容
   */
  function downloadTextFile(filename, content) {
    var safeFilename = (filename != null && String(filename).trim() !== '') ? String(filename) : 'download.txt';
    var safeContent = (content != null) ? String(content) : '';

    try {
      // 使用 UTF-8 BOM 确保中文在各编辑器中正确显示
      var BOM = '\uFEFF';
      var blob = new Blob([BOM + safeContent], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);

      var link = document.createElement('a');
      link.href = url;
      link.download = safeFilename;
      // 将元素加入 DOM 以兼容 Firefox
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // 清理临时资源
      setTimeout(function () {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error('文件下载失败：', e);
    }
  }

  /**
   * 截断文本到指定最大长度，超出部分用 '...' 替代
   *
   * @param {string} text - 原始文本
   * @param {number} maxLen - 最大允许长度（不含省略号）
   * @returns {string} 截断后的文本
   */
  function truncateText(text, maxLen) {
    if (text == null) {
      return '';
    }

    var str = String(text);
    var limit = (typeof maxLen === 'number' && maxLen > 0) ? maxLen : 100;

    if (str.length <= limit) {
      return str;
    }

    return str.substring(0, limit) + '...';
  }

  /**
   * 转义 HTML 特殊字符，防止 XSS 注入
   * 转义字符：< > & " '
   *
   * @param {string} str - 需要转义的字符串
   * @returns {string} 转义后的安全字符串
   */
  function escapeHTML(str) {
    if (str == null) {
      return '';
    }

    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 挂载到全局对象
  window.Utils = {
    formatTime: formatTime,
    countTextLength: countTextLength,
    splitTags: splitTags,
    copyToClipboard: copyToClipboard,
    downloadTextFile: downloadTextFile,
    truncateText: truncateText,
    escapeHTML: escapeHTML
  };
})();
