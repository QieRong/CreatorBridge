const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadAdapters() {
  const window = {
    Models: {
      createAdaptedContent(platformId, platformName, title, body, tags, tips, warnings, estimatedLength) {
        return { platformId, platformName, title, body, tags, tips, warnings, estimatedLength };
      }
    },
    Utils: {
      countTextLength(text) {
        return String(text || '').trim().length;
      },
      truncateText(text, maxLength) {
        const source = String(text || '');
        return source.length > maxLength ? source.slice(0, maxLength) + '...' : source;
      }
    },
    console: { warn() {}, error() {} }
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'adapters.js'), 'utf8');
  vm.runInNewContext(source, { window, console: window.console });
  return window.Adapters;
}

const unified = {
  title: 'AI 时代的内容创作者生存指南',
  body: '创作者需要从“拼产量”转向“拼洞察”，同时保持个人特色和深度思考，把更多时间用于选题判断、资料核验与持续复盘，而不是只关注更新频率。\n第二，建立个人的知识库和风格护城河。',
  tags: ['AI', '创作者']
};

test('快速适配不注入无依据的套话或工具署名', () => {
  const adapters = loadAdapters();
  const contents = adapters.adaptContentForSelectedPlatforms(
    ['wechat', 'zhihu', 'bilibili', 'xiaohongshu', 'weibo'],
    unified
  );
  const text = contents.map((content) => content.title + '\n' + content.body).join('\n');

  assert.doesNotMatch(text, /谢邀。|CreatorBridge 模拟适配生成|点击长文查看全文|更多精彩内容请看完整视频\/专栏|绝绝子|家人们/);
});

test('公众号快速适配的导语不截断在原句中间', () => {
  const adapters = loadAdapters();
  const content = adapters.adaptToWechat(unified);

  assert.match(content.body, /【导语】创作者需要从“拼产量”转向“拼洞察”[\s\S]*更新频率。/);
  assert.doesNotMatch(content.body, /【导语】[^\n]*\.\.\./);
});

test('小红书快速适配限制标签数量', () => {
  const adapters = loadAdapters();
  const content = adapters.adaptToXiaohongshu({
    title: '标签限制测试',
    body: '这是一句完整内容。',
    tags: ['一', '二', '三', '四', '五', '六', '七']
  });

  assert.equal(content.tags.length, 6);
});

test('小红书快速适配在超长时按完整句子收口', () => {
  const adapters = loadAdapters();
  const longBody = Array.from({ length: 30 }, (_, index) =>
    '第' + (index + 1) + '段内容说明了创作者需要围绕真实经验持续复盘，避免为了更新频率而牺牲内容质量。'
  ).join('\n');
  const content = adapters.adaptToXiaohongshu({
    title: '一段用于测试平台长度限制的标题内容',
    body: longBody,
    tags: ['一', '二', '三', '四', '五', '六', '七']
  });

  assert.ok(content.body.length <= 1000);
  assert.doesNotMatch(content.body, /\.\.\.|…{2,}/);
});
