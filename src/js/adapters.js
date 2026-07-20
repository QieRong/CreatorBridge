/**
 * CreatorBridge - 平台内容适配器模块
 * 负责将统一内容模型转换为各平台专属格式
 * 
 * 适配器统一接口思想：每个适配器都有 transform 方法
 * 新增平台只需新增对应的 adapt 函数并注册到 adapterMap 中
 */

;(function () {
  'use strict';

  // 依赖检查
  var Models = window.Models;
  var Utils = window.Utils;

  function getLeadingSentence(text) {
    var source = String(text || '').replace(/\s*\n\s*/g, ' ').trim();
    if (!source) return '';

    var match = source.match(/^[\s\S]*?[。！？；]/);
    return match ? match[0].trim() : source;
  }

  function truncateAtBoundary(text, maxLength) {
    var source = String(text || '').trim();
    var limit = Number(maxLength);
    if (!Number.isFinite(limit) || limit <= 0 || !source) return '';
    if (source.length <= limit) return source;

    var prefix = source.slice(0, Math.max(1, limit - 1));
    var boundary = Math.max(
      prefix.lastIndexOf('。'), prefix.lastIndexOf('！'), prefix.lastIndexOf('？'),
      prefix.lastIndexOf('；'), prefix.lastIndexOf('，'), prefix.lastIndexOf('、'),
      prefix.lastIndexOf('：'), prefix.lastIndexOf(' ')
    );
    var result = boundary > 0 ? prefix.slice(0, boundary + 1).trim() : prefix.trim();
    return result + '…';
  }

  function getSentenceExcerpt(text, maxLength) {
    return truncateAtBoundary(getLeadingSentence(text), maxLength);
  }

  function truncateBodyBySentence(text, maxLength) {
    var source = String(text || '').trim();
    var limit = Number(maxLength);
    if (!Number.isFinite(limit) || limit <= 0 || !source) return '';
    if (source.length <= limit) return source;

    var prefix = source.slice(0, Math.max(1, limit - 1));
    var boundary = Math.max(
      prefix.lastIndexOf('。'), prefix.lastIndexOf('！'), prefix.lastIndexOf('？'),
      prefix.lastIndexOf('；'), prefix.lastIndexOf('\n')
    );
    var result = boundary >= 0 ? prefix.slice(0, boundary + 1).trim() : prefix.trim();
    return result + '…';
  }

  /**
   * 微信公众号适配器
   * 风格：正式、权威、逻辑严密，适合深度长文
   * @param {Object} unified - 统一内容模型
   * @returns {Object} 适配后的内容
   */
  function adaptToWechat(unified) {
    var title = unified.title || '';
    var body = unified.body || '';
    var tags = unified.tags || [];

    // 标题处理：保留原意，不额外添加夸张前缀
    var adaptedTitle = truncateAtBoundary(title, 64);

    // 正文转化：添加导语、分段、重点总结
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 导语优先保留原文首个完整句子，避免出现半句和多个句点
    var summary = getLeadingSentence(bodyLines[0] || body);

    var adaptedBody = '';
    adaptedBody += '【导语】' + summary + '\n\n';

    // 主体内容分段处理
    adaptedBody += '━━━━━━━━━━━━━━━━━━━━\n\n';
    bodyLines.forEach(function (line, index) {
      if (line.trim().length > 0) {
        adaptedBody += line.trim() + '\n\n';
      }
    });

    // 提取核心观点作为总结
    var keyPoints = bodyLines.slice(0, 3).map(function (line, i) {
      return (i + 1) + '、' + getLeadingSentence(line);
    });

    adaptedBody += '━━━━━━━━━━━━━━━━━━━━\n\n';
    adaptedBody += '【重点总结】\n';
    adaptedBody += keyPoints.join('\n') + '\n\n';
    adaptedBody += '━━━━━━━━━━━━━━━━━━━━';
    adaptedBody = truncateBodyBySentence(adaptedBody, 8000);

    // 标签处理：保留原始标签作为关键词
    var adaptedTags = tags.slice(0, 8);

    // 发布建议
    var tips = [
      '建议配合图文排版工具（如135编辑器）进行二次排版',
      '推荐添加封面图，比例 2.35:1 最佳',
      '正文中可适当添加图片以提升阅读体验',
      '发布时间建议：工作日早8点或晚8点'
    ];

    var warnings = [];
    if (body.length > 5000) {
      warnings.push('正文较长，建议分上下篇发布');
    }

    return Models.createAdaptedContent(
      'wechat',
      '微信公众号',
      adaptedTitle,
      adaptedBody.trim(),
      adaptedTags,
      tips,
      warnings,
      Utils.countTextLength(adaptedBody)
    );
  }

  /**
   * 知乎适配器
   * 风格：理性分析、问题导向、Markdown格式
   * @param {Object} unified - 统一内容模型
   * @returns {Object} 适配后的内容
   */
  function adaptToZhihu(unified) {
    var title = unified.title || '';
    var body = unified.body || '';
    var tags = unified.tags || [];

    // 标题处理：转换为问题式标题
    var adaptedTitle = title;
    if (title && !title.includes('？') && !title.includes('?')) {
      adaptedTitle = '如何评价「' + title + '」？';
    }
    adaptedTitle = truncateAtBoundary(adaptedTitle, 50);

    // 正文转化：知乎风格
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 提取核心结论
    var coreConclusion = bodyLines.length > 0
      ? getLeadingSentence(bodyLines[0])
      : '以下是关于此话题的深度分析。';

    var adaptedBody = '';
    adaptedBody += '**核心结论：' + coreConclusion + '**\n\n';
    adaptedBody += '---\n\n';

    // 正文采用 Markdown 格式分点论证
    adaptedBody += '## 详细分析\n\n';
    bodyLines.forEach(function (line, index) {
      var trimmed = line.trim();
      if (trimmed.length > 0) {
        if (index === 0) {
          adaptedBody += '**首先**，' + trimmed + '\n\n';
        } else if (index === bodyLines.length - 1) {
          adaptedBody += '**最后**，' + trimmed + '\n\n';
        } else {
          adaptedBody += '**第' + (index + 1) + '点**，' + trimmed + '\n\n';
        }
      }
    });

    adaptedBody += '---';
    adaptedBody = truncateBodyBySentence(adaptedBody, 10000);

    // 标签处理：限制5个，偏专业
    var adaptedTags = tags.slice(0, 5);

    var tips = [
      '知乎回答建议使用 Markdown 格式排版',
      '可在回答中引用权威数据来源增加可信度',
      '建议添加个人经历或案例提升说服力',
      '发布后可在相关问题下同步回答以获得更多曝光'
    ];

    var warnings = [];
    if (adaptedTags.length === 0) {
      warnings.push('建议添加知乎话题标签以获得更多推荐');
    }

    return Models.createAdaptedContent(
      'zhihu',
      '知乎',
      adaptedTitle,
      adaptedBody.trim(),
      adaptedTags,
      tips,
      warnings,
      Utils.countTextLength(adaptedBody)
    );
  }

  /**
   * B站适配器
   * 风格：年轻化、玩梗、互动引导、视频简介风
   * @param {Object} unified - 统一内容模型
   * @returns {Object} 适配后的内容
   */
  function adaptToBilibili(unified) {
    var title = unified.title || '';
    var body = unified.body || '';
    var tags = unified.tags || [];

    // 标题处理：保留原始标题，避免生成无依据的营销表达
    var adaptedTitle = truncateAtBoundary(title, 80);

    // 正文转化：视频简介风格
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 提取看点
    var highlights = bodyLines.slice(0, 2).map(function (line) {
      return getSentenceExcerpt(line, 240);
    });

    var adaptedBody = '';
    adaptedBody += '内容要点：\n';
    highlights.forEach(function (h) {
      adaptedBody += '▶ ' + h + '\n';
    });
    adaptedBody += '\n';

    adaptedBody += '内容简介：\n';
    // 正文极简保留
    var briefContent = bodyLines.slice(0, 5).map(function (line) {
      return '• ' + getSentenceExcerpt(line, 300);
    });
    adaptedBody += briefContent.join('\n') + '\n\n';
    adaptedBody = truncateBodyBySentence(adaptedBody, 2000);


    // 标签处理
    var adaptedTags = tags.slice(0, 12);

    var tips = [
      'B站视频简介建议控制在250字以内',
      '标题中使用【】符号可以增加点击率',
      '建议在视频开头3秒内展示核心卖点',
      '合理使用分区标签有助于获取推荐流量'
    ];

    var warnings = [];
    if (Utils.countTextLength(adaptedBody) > 250) {
      warnings.push('视频简介内容较长，建议精简以提升用户阅读体验');
    }

    return Models.createAdaptedContent(
      'bilibili',
      'B站',
      adaptedTitle,
      adaptedBody.trim(),
      adaptedTags,
      tips,
      warnings,
      Utils.countTextLength(adaptedBody)
    );
  }

  /**
   * 小红书适配器
   * 风格：口语化、种草、Emoji丰富、短标题
   * @param {Object} unified - 统一内容模型
   * @returns {Object} 适配后的内容
   */
  function adaptToXiaohongshu(unified) {
    var title = unified.title || '';
    var body = unified.body || '';
    var tags = unified.tags || [];

    // 标题处理：遵守平台长度，不添加夸张模板词
    var adaptedTitle = truncateAtBoundary(title, 20);

    // 正文转化：口语化、碎片化、Emoji点缀
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    var emojiList = ['📌', '💡', '👉', '✅', '🌟', '💪', '🎯', '❤️'];
    var adaptedBody = '';

    bodyLines.forEach(function (line, index) {
      var emoji = emojiList[index % emojiList.length];
      var trimmed = getSentenceExcerpt(line, 160);
      adaptedBody += emoji + ' ' + trimmed + '\n\n';
    });

    // 标签处理：转换为 #话题 格式
    var adaptedTags = tags.slice(0, 6).map(function (tag) {
      return '#' + tag;
    });

    var tagText = adaptedTags.join(' ');
    var bodyLimit = 1000 - (tagText ? tagText.length + 2 : 0);
    adaptedBody = truncateBodyBySentence(adaptedBody, bodyLimit);

    // 在正文底部追加话题标签
    if (adaptedTags.length > 0) {
      adaptedBody += '\n\n' + tagText;
    }

    var tips = [
      '小红书标题务必控制在20字以内',
      '首图/封面非常重要，建议使用精美配图',
      '正文中多使用 Emoji 可增加吸引力',
      '发布时间建议：中午12点或晚上8点',
      '话题标签有助于获取系统流量推荐'
    ];

    var warnings = [];
    if (Utils.countTextLength(body) > 800) {
      warnings.push('原始正文较长，小红书用户偏好短内容，建议精简');
    }

    return Models.createAdaptedContent(
      'xiaohongshu',
      '小红书',
      adaptedTitle,
      adaptedBody.trim(),
      adaptedTags,
      tips,
      warnings,
      Utils.countTextLength(adaptedBody)
    );
  }

  /**
   * 微博适配器
   * 风格：短平快，带有明显的微博话题格式，字数较少
   * @param {Object} unified - 统一内容模型
   * @returns {Object} 适配后的内容
   */
  function adaptToWeibo(unified) {
    var title = unified.title || '';
    var body = unified.body || '';
    var tags = unified.tags || [];

    // 微博没有单独的标题字段，通常把标题放在正文最前面，用【】括起来
    var adaptedTitle = '';
    var adaptedBody = '';

    if (title) {
      adaptedBody += '【' + title + '】\n';
    }

    // 正文转化：精简、保留核心信息
    // 如果太长则截断，留出话题空间
    var bodyLengthLimit = 130; 
    var truncatedBody = truncateAtBoundary(body.replace(/\n/g, ' '), bodyLengthLimit) + '\n';
    adaptedBody += truncatedBody;

    // 标签处理：微博标准的话题格式是 #话题#
    var adaptedTags = tags.slice(0, 5).map(function (tag) {
      return '#' + tag + '#';
    });

    if (adaptedTags.length > 0) {
      adaptedBody += '\n' + adaptedTags.join(' ');
    }
    adaptedBody = truncateBodyBySentence(adaptedBody, 1500);

    var tips = [
      '微博更适合短平快的碎片化信息表达',
      '带上热门 #话题# 能有效增加曝光',
      '如果有长篇大论，建议配上长图发布'
    ];

    var warnings = [];
    if (Utils.countTextLength(body) > 140) {
      warnings.push('正文长度超过140字，可能需要发长图或头条文章');
    }

    return Models.createAdaptedContent(
      'weibo',
      '微博',
      adaptedTitle,
      adaptedBody.trim(),
      adaptedTags,
      tips,
      warnings,
      Utils.countTextLength(adaptedBody)
    );
  }

  /**
   * 适配器注册表 —— 新增平台只需在此注册
   */
  var adapterMap = {
    wechat: adaptToWechat,
    zhihu: adaptToZhihu,
    bilibili: adaptToBilibili,
    xiaohongshu: adaptToXiaohongshu,
    weibo: adaptToWeibo
  };

  /**
   * 根据平台ID调用对应适配器
   * @param {string} platformId - 平台ID
   * @param {Object} unified - 统一内容模型
   * @returns {Object|null} 适配后的内容，平台不存在时返回 null
   */
  function adaptContentForPlatform(platformId, unified) {
    var adapter = adapterMap[platformId];
    if (!adapter) {
      console.warn('未找到平台适配器：' + platformId);
      return null;
    }
    try {
      return adapter(unified);
    } catch (e) {
      console.error('适配器执行出错 [' + platformId + ']：', e);
      return null;
    }
  }

  /**
   * 批量适配多个平台
   * @param {Array<string>} platformIds - 平台ID数组
   * @param {Object} unified - 统一内容模型
   * @returns {Array<Object>} 适配结果数组
   */
  function adaptContentForSelectedPlatforms(platformIds, unified) {
    if (!Array.isArray(platformIds) || platformIds.length === 0) {
      return [];
    }
    return platformIds
      .map(function (id) {
        return adaptContentForPlatform(id, unified);
      })
      .filter(function (result) {
        return result !== null;
      });
  }

  // 全局挂载
  window.Adapters = {
    adaptToWechat: adaptToWechat,
    adaptToZhihu: adaptToZhihu,
    adaptToBilibili: adaptToBilibili,
    adaptToXiaohongshu: adaptToXiaohongshu,
    adaptToWeibo: adaptToWeibo,
    adaptContentForPlatform: adaptContentForPlatform,
    adaptContentForSelectedPlatforms: adaptContentForSelectedPlatforms
  };

})();
