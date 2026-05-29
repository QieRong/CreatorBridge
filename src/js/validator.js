/**
 * CreatorBridge - 格式校验模块
 * 负责对原始内容和适配后内容进行格式检查
 * 
 * 校验结果分为三个级别：
 *   error   - 必须修复，阻止发布
 *   warning - 建议优化，不阻止发布
 *   info    - 普通提示，仅供参考
 */

;(function () {
  'use strict';

  var Utils = window.Utils;
  var Platforms = window.Platforms;

  /**
   * 构建校验消息对象
   * @param {string} level - 级别：error / warning / info / success
   * @param {string} message - 提示信息
   * @param {string} [platform] - 相关平台（可选）
   * @returns {Object} 校验消息
   */
  function buildValidationMessage(level, message, platform) {
    return {
      level: level || 'info',
      message: message || '',
      platform: platform || '通用'
    };
  }

  /**
   * 校验原始内容（标题、正文、标签、素材）
   * @param {string} title - 标题
   * @param {string} body - 正文
   * @param {string} tags - 标签字符串
   * @param {string} media - 素材链接
   * @param {Array} selectedPlatforms - 选中的平台ID数组
   * @returns {Array} 校验消息数组
   */
  function validateRawContent(title, body, tags, media, selectedPlatforms) {
    var messages = [];

    // 通用校验：标题为空
    if (!title || title.trim() === '') {
      messages.push(buildValidationMessage('error', '标题不能为空！请输入文章标题。'));
    }

    // 通用校验：正文为空
    if (!body || body.trim() === '') {
      messages.push(buildValidationMessage('error', '正文内容不能为空！请输入正文。'));
    }

    // 通用校验：未选择平台
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      messages.push(buildValidationMessage('error', '请至少选择一个发布平台以进行适配！'));
    }

    // 标签为空提醒
    if (!tags || tags.trim() === '') {
      messages.push(buildValidationMessage('info', '未填写标签。添加标签可以提升内容的曝光度和推荐效果。'));
    }

    // 标签数量检查
    if (tags && tags.trim() !== '') {
      var tagList = Utils?.splitTags(tags) || [];
      if (tagList.length > 12) {
        messages.push(buildValidationMessage('warning', '标签数量较多（' + tagList.length + '个），部分平台可能会截断，建议精简。'));
      }
    }

    // 素材链接为空提醒
    if (!media || media.trim() === '') {
      messages.push(buildValidationMessage('info', '未填写素材链接或备注。添加配图素材可以提升各平台的展示效果。'));
    }

    return messages;
  }

  /**
   * 校验适配后内容（针对各平台具体限制）
   * @param {Array} adaptedContents - 适配后内容数组
   * @returns {Array} 校验消息数组
   */
  function validateAdaptedContent(adaptedContents) {
    var messages = [];

    if (!Array.isArray(adaptedContents) || adaptedContents.length === 0) {
      return messages;
    }

    adaptedContents.forEach(function (content) {
      if (!content) return;

      var platform = Platforms?.getPlatformById(content.platformId);
      if (!platform) return;

      var titleLen = Utils?.countTextLength(content.title) || 0;
      var bodyLen = Utils?.countTextLength(content.body) || 0;
      var tagCount = (content.tags || []).length;

      // 公众号校验
      if (content.platformId === 'wechat') {
        if (titleLen > 64) {
          messages.push(buildValidationMessage('warning',
            '微信公众号标题较长（' + titleLen + '字），建议缩减至 64 字以内以确保展示完整。', '公众号'));
        }
      }

      // 知乎校验
      if (content.platformId === 'zhihu') {
        if (titleLen > 50) {
          messages.push(buildValidationMessage('warning',
            '知乎标题偏长（' + titleLen + '字），建议精简在 50 字内，更适合问答推荐。', '知乎'));
        }
        if (tagCount > 5) {
          messages.push(buildValidationMessage('warning',
            '知乎话题标签最多支持 5 个，当前 ' + tagCount + ' 个，超出部分可能会被截断。', '知乎'));
        }
      }

      // B站校验
      if (content.platformId === 'bilibili') {
        if (titleLen > 80) {
          messages.push(buildValidationMessage('warning',
            'B站专栏/视频简介标题过长（' + titleLen + '字），建议控制在 80 字以内。', 'B站'));
        }
      }

      // 小红书校验
      if (content.platformId === 'xiaohongshu') {
        if (titleLen > 20) {
          messages.push(buildValidationMessage('error',
            '🚨 小红书标题不能超过 20 个字！当前 ' + titleLen + ' 字，请立刻修改。', '小红书'));
        }
        if (bodyLen > 1000) {
          messages.push(buildValidationMessage('error',
            '🚨 小红书正文最大支持 1000 字！当前 ' + bodyLen + ' 字，超出无法发布。', '小红书'));
        } else if (bodyLen > 800) {
          messages.push(buildValidationMessage('warning',
            '⚠️ 小红书内容逼近 1000 字上限（' + bodyLen + '字），建议适当精简。', '小红书'));
        }
        if (tagCount === 0) {
          messages.push(buildValidationMessage('warning',
            '💡 小红书建议至少添加 1 个话题标签以获取系统流量推荐。', '小红书'));
        }
      }
    });

    // 如果没有任何问题，给一个成功提示
    if (messages.length === 0) {
      messages.push(buildValidationMessage('success', '✅ 所有平台内容格式检查通过！可以进行模拟发布。'));
    }

    return messages;
  }

  // 全局挂载
  window.Validator = {
    buildValidationMessage: buildValidationMessage,
    validateRawContent: validateRawContent,
    validateAdaptedContent: validateAdaptedContent
  };

})();
