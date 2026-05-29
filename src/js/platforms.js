/**
 * CreatorBridge - 平台配置模块
 * 集中管理所有支持的社交媒体平台配置信息
 * 新增平台时只需在 platformConfigs 数组中添加配置即可
 */

(function () {
  'use strict';

  /**
   * 平台配置列表
   * 每个配置项包含平台的基础信息和内容限制规则
   *
   * 字段说明：
   *   id             - 平台唯一标识，用于程序内部引用
   *   name           - 平台显示名称
   *   icon           - 平台图标（emoji）
   *   description    - 平台特点描述，用于 UI 展示
   *   maxTitleLength - 标题最大字符数
   *   maxBodyLength  - 正文最大字符数
   *   maxTags        - 最大标签数量
   *   color          - 平台品牌主色调，用于 UI 区分
   *
   * 注意：以上限制数值仅作为项目内模拟规则，不完全等同各平台真实官方规则
   */
  var platformConfigs = [
    {
      id: 'wechat',
      name: '微信公众号',
      icon: '📱',
      description: '适合深度长文、图文排版，面向微信生态用户',
      maxTitleLength: 64,
      maxBodyLength: 8000,
      maxTags: 8,
      color: '#07C160'
    },
    {
      id: 'zhihu',
      name: '知乎',
      icon: '💡',
      description: '适合专业知识分享、观点讨论，面向高知社群',
      maxTitleLength: 50,
      maxBodyLength: 10000,
      maxTags: 5,
      color: '#0084FF'
    },
    {
      id: 'bilibili',
      name: 'B站',
      icon: '📺',
      description: '适合视频简介、专栏文章，面向年轻Z世代用户',
      maxTitleLength: 80,
      maxBodyLength: 2000,
      maxTags: 12,
      color: '#FB7299'
    },
    {
      id: 'xiaohongshu',
      name: '小红书',
      icon: '📕',
      description: '适合种草笔记、生活分享，面向追求审美的年轻用户',
      maxTitleLength: 20,
      maxBodyLength: 1000,
      maxTags: 10,
      color: '#FE2C55'
    }
  ];

  /**
   * 获取所有平台配置
   * 返回配置数组的浅拷贝，防止外部直接修改内部数据
   *
   * @returns {object[]} 所有平台配置的数组
   */
  function getAllPlatforms() {
    return platformConfigs.map(function (config) {
      // 返回每个配置的浅拷贝
      return Object.assign({}, config);
    });
  }

  /**
   * 根据平台 ID 获取单个平台配置
   * 找不到时返回 null
   *
   * @param {string} id - 平台唯一标识，如 'wechat'
   * @returns {object|null} 平台配置对象或 null
   */
  function getPlatformById(id) {
    if (id == null || String(id).trim() === '') {
      return null;
    }

    var targetId = String(id).trim().toLowerCase();

    for (var i = 0; i < platformConfigs.length; i++) {
      if (platformConfigs[i].id === targetId) {
        // 返回浅拷贝，防止外部修改内部数据
        return Object.assign({}, platformConfigs[i]);
      }
    }

    return null;
  }

  // 挂载到全局对象
  window.Platforms = {
    getAllPlatforms: getAllPlatforms,
    getPlatformById: getPlatformById
  };
})();
