const assert = require('node:assert/strict');
const test = require('node:test');

let AiUtils = {};
try {
  AiUtils = require('../src/js/ai-utils.js');
} catch (error) {
  AiUtils = {};
}

function getPlatformById(id) {
  const configs = {
    xiaohongshu: {
      id: 'xiaohongshu',
      name: '小红书',
      maxTitleLength: 20,
      maxBodyLength: 1000,
      maxTags: 6
    },
    wechat: {
      id: 'wechat',
      name: '微信公众号',
      maxTitleLength: 64,
      maxBodyLength: 8000,
      maxTags: 8
    }
  };
  return configs[id] || null;
}

test('truncateBySentence 优先保留完整句子且总长度不超限', () => {
  const result = AiUtils.truncateBySentence('第一句。第二句内容较长。', 5);

  assert.equal(result, '第一句。…');
  assert.ok(result.length <= 5);
});

test('formatOriginalContent 返回未截断的用户输入内容', () => {
  const original = {
    title: '完整标题',
    body: '第一句内容。\n第二句内容。',
    tags: ['标签一', '标签二']
  };

  const result = AiUtils.formatOriginalContent(original);

  assert.match(result, /标题：完整标题/);
  assert.match(result, /第一句内容。\n第二句内容。/);
  assert.match(result, /标签：标签一、标签二/);
  assert.doesNotMatch(result, /\.\.\.|…/);
});

test('normalizeAiTargets 拒绝缺少已选平台的 AI 返回', () => {
  const result = AiUtils.normalizeAiTargets([], ['wechat'], getPlatformById);

  assert.equal(result.ok, false);
  assert.match(result.message, /平台/);
});

test('normalizeAiTargets 拒绝标题或正文为空的平台内容', () => {
  const result = AiUtils.normalizeAiTargets([{
    platformId: 'wechat',
    platformName: '公众号',
    title: '有效标题',
    body: '   ',
    tags: []
  }], ['wechat'], getPlatformById);

  assert.equal(result.ok, false);
  assert.match(result.message, /不完整/);
});

test('normalizeAiTargets 规整超限的小红书标题正文和标签', () => {
  const result = AiUtils.normalizeAiTargets([{
    platformId: 'xiaohongshu',
    platformName: '随意名称',
    title: '小红书标题'.repeat(10),
    body: ('这是一个完整句子。').repeat(160),
    tags: ['一', '二', '三', '四', '五', '六', '七']
  }], ['xiaohongshu'], getPlatformById);

  assert.equal(result.ok, true);
  assert.equal(result.targets[0].platformName, '小红书');
  assert.ok(result.targets[0].title.length <= 20);
  assert.ok(result.targets[0].title.endsWith('…'));
  assert.ok(result.targets[0].body.length <= 1000);
  assert.equal(result.targets[0].tags.length, 6);
});
