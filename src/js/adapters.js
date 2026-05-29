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

    // 标题处理：沿用原始标题，适当润色使其正式
    var adaptedTitle = title;
    if (title && !title.endsWith('》') && !title.endsWith('」')) {
      adaptedTitle = '深度解读：' + title;
    }

    // 正文转化：添加导语、分段、重点总结、版权声明
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 提取正文前80字作为导语
    var summary = body.substring(0, 80).replace(/\n/g, ' ');
    if (body.length > 80) {
      summary += '...';
    }

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
      return (i + 1) + '、' + Utils.truncateText(line.trim(), 40);
    });

    adaptedBody += '━━━━━━━━━━━━━━━━━━━━\n\n';
    adaptedBody += '【重点总结】\n';
    adaptedBody += keyPoints.join('\n') + '\n\n';
    adaptedBody += '━━━━━━━━━━━━━━━━━━━━\n';
    adaptedBody += '声明：本文由 CreatorBridge 模拟适配生成，版权归原作者所有。';

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

    // 正文转化：知乎风格
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 提取核心结论
    var coreConclusion = bodyLines.length > 0
      ? Utils.truncateText(bodyLines[0].trim(), 60)
      : '以下是关于此话题的深度分析。';

    var adaptedBody = '';
    adaptedBody += '谢邀。\n\n';
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

    adaptedBody += '---\n\n';
    adaptedBody += '## 总结\n\n';
    adaptedBody += '以上是我对「' + title + '」的个人见解，欢迎各位知友在评论区理性探讨，分享不同的观点和看法。\n\n';
    adaptedBody += '> 如果这个回答对你有帮助，欢迎点赞支持 👍';

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

    // 标题处理：添加吸睛词和看点
    var adaptedTitle = '【干货预警】' + title + '！看完直接起飞！';
    if (adaptedTitle.length > 80) {
      adaptedTitle = '【必看】' + title;
    }

    // 正文转化：视频简介风格
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 提取看点
    var highlights = bodyLines.slice(0, 2).map(function (line) {
      return Utils.truncateText(line.trim(), 30);
    });

    var adaptedBody = '';
    adaptedBody += '🌟 本期看点：\n';
    highlights.forEach(function (h) {
      adaptedBody += '▶ ' + h + '\n';
    });
    adaptedBody += '\n';

    adaptedBody += '📝 内容简介：\n';
    // 正文极简保留
    var briefContent = bodyLines.slice(0, 5).map(function (line) {
      return '• ' + Utils.truncateText(line.trim(), 50);
    });
    adaptedBody += briefContent.join('\n') + '\n\n';

    if (bodyLines.length > 5) {
      adaptedBody += '......更多精彩内容请看完整视频/专栏！\n\n';
    }

    // 互动引导
    adaptedBody += '💬 小伙伴们觉得怎么样？欢迎在评论区留下你们的想法！\n\n';
    adaptedBody += '━━━━━━━━━━━━━━━━━━━━\n';
    adaptedBody += '三连预警！觉得本期内容对你有帮助的话，\n';
    adaptedBody += '别忘了【点赞👍+投币💰+收藏⭐】支持一下UP主哦！\n';
    adaptedBody += '(🔔゜-゜)つロ 干杯~';

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

    // 标题处理：截取前15字，添加Emoji
    var shortTitle = title.substring(0, 15);
    var adaptedTitle = '🔥 ' + shortTitle;
    if (title.length > 15) {
      adaptedTitle += '...绝绝子！✨';
    } else {
      adaptedTitle += ' ✨';
    }
    // 确保不超过20字（含Emoji）
    if (adaptedTitle.length > 22) {
      adaptedTitle = '🔥' + title.substring(0, 14) + '✨';
    }

    // 正文转化：口语化、碎片化、Emoji点缀
    var bodyLines = body.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    // 关键词提取
    var keyword = title.substring(0, 8);

    var emojiList = ['📌', '💡', '👉', '✅', '🌟', '💪', '🎯', '❤️'];
    var adaptedBody = '';
    adaptedBody += '家人们！今天必须给你们安利' + keyword + '！👇\n\n';

    bodyLines.forEach(function (line, index) {
      var emoji = emojiList[index % emojiList.length];
      var trimmed = Utils.truncateText(line.trim(), 60);
      adaptedBody += emoji + ' ' + trimmed + '\n\n';
    });

    // 尾部互动
    adaptedBody += '～～～～～～～～～～\n';
    adaptedBody += '姐妹们觉得怎么样？在评论区一起讨论吧！💖\n';
    adaptedBody += '觉得有用的话记得点赞收藏哦～比心 🫶\n\n';

    // 标签处理：转换为 #话题 格式
    var adaptedTags = tags.slice(0, 10).map(function (tag) {
      return '#' + tag;
    });

    // 在正文底部追加话题标签
    if (adaptedTags.length > 0) {
      adaptedBody += adaptedTags.join(' ');
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
   * 适配器注册表 —— 新增平台只需在此注册
   */
  var adapterMap = {
    wechat: adaptToWechat,
    zhihu: adaptToZhihu,
    bilibili: adaptToBilibili,
    xiaohongshu: adaptToXiaohongshu
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

  // =================================================================
  // 🔮 未来加分亮点扩展：对接 antigravity 平台 Skills 接口预留与钩子设计
  // =================================================================

  /**
   * 预留接口 1：外部文章 URL 内容智能抓取 (对接 web-fetch 技能)
   * @param {string} url - 外部文章的源链接地址
   * @returns {Promise<Object>} 解析后的 UnifiedContent 结构数据
   */
  function fetchAndParseExternalArticle(url) {
    console.log('[Future Hook] 正在调用 web-fetch 技能抓取外部文章：', url);
    // 真实场景下，在此处发起请求，调用本地或服务端的 web-fetch API 进行内容抓取与 HTML 降级为 Markdown
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          title: '从外部抓取的文章标题',
          body: '抓取到的正文内容占位...',
          tags: ['外部引入', '自动抓取'],
          sourceUrl: url
        });
      }, 500);
    });
  }

  /**
   * 预留接口 2：AI 风格智能重写引擎 (对接 text-rewriter 技能)
   * @param {Object} unifiedContent - 统一文章内容
   * @param {string} targetPlatform - 目标平台 ID（wechat, zhihu, bilibili, xiaohongshu）
   * @returns {Promise<string>} LLM 润色改写后的专属风格文案
   */
  function aiStyleRewrite(unifiedContent, targetPlatform) {
    console.log('[Future Hook] 正在调用 text-rewriter 技能对内容进行 AI 改写，目标平台：', targetPlatform);
    // 真实场景下，在此处构造 Prompt 模板，调用 LLM 对正文和标题进行深度重写
    return new Promise(function (resolve) {
      setTimeout(function () {
        var mockedRewritten = '【AI 智能改写文案】\n' + (unifiedContent.body || '');
        resolve(mockedRewritten);
      }, 800);
    });
  }

  /**
   * 预留接口 3：多媒体素材云图床适配 (对接 oss-uploader / image-processor 技能)
   * @param {string} localImagePath - 本地图片路径或原图链接
   * @param {string} platformId - 目标平台的图片尺寸和比例策略
   * @returns {Promise<string>} 七牛云 OSS 智能裁剪压缩后的 CDN 高速链接
   */
  function processAndUploadMedia(localImagePath, platformId) {
    console.log('[Future Hook] 正在调用 image-processor 进行七牛云 OSS 高速压缩与智能裁剪，适配平台：', platformId);
    // 真实场景下，在此处调用七牛云图片处理服务管道参数（如 ?imageView2/1/w/900/h/383/format/webp）进行压缩转换
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve('https://cdn.creatorbridge.qiniu.com/mock_media_' + platformId + '.webp');
      }, 300);
    });
  }

  // 全局挂载
  window.Adapters = {
    adaptToWechat: adaptToWechat,
    adaptToZhihu: adaptToZhihu,
    adaptToBilibili: adaptToBilibili,
    adaptToXiaohongshu: adaptToXiaohongshu,
    adaptContentForPlatform: adaptContentForPlatform,
    adaptContentForSelectedPlatforms: adaptContentForSelectedPlatforms,
    // 预留的 Skills 集成核心接口
    fetchAndParseExternalArticle: fetchAndParseExternalArticle,
    aiStyleRewrite: aiStyleRewrite,
    processAndUploadMedia: processAndUploadMedia
  };

})();

