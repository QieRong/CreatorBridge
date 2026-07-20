const assert = require('node:assert/strict');
const test = require('node:test');

let AiClient = {};
try {
  AiClient = require('../src/js/ai-client.js');
} catch (error) {
  AiClient = {};
}

test('adaptWithFallback 使用完整的 AI 结果', async () => {
  const result = await AiClient.adaptWithFallback({
    payload: { title: '标题', body: '正文', tags: [], platforms: ['wechat'] },
    fetchImpl: async () => ({ ok: true, json: async () => ({ targets: [{ platformId: 'wechat' }] }) }),
    normalize: () => ({ ok: true, targets: [{ platformId: 'wechat', title: 'AI 标题' }] }),
    fallback: () => [{ platformId: 'wechat', title: '规则标题' }]
  });

  assert.equal(result.mode, 'ai');
  assert.equal(result.targets[0].title, 'AI 标题');
});

test('adaptWithFallback 在 AI 服务异常时调用规则回退', async () => {
  let fallbackCalls = 0;
  const result = await AiClient.adaptWithFallback({
    payload: { title: '标题', body: '正文', tags: [], platforms: ['wechat'] },
    fetchImpl: async () => { throw new TypeError('fetch failed'); },
    normalize: () => ({ ok: true, targets: [] }),
    fallback: () => {
      fallbackCalls += 1;
      return [{ platformId: 'wechat', title: '规则标题' }];
    }
  });

  assert.equal(result.mode, 'fallback');
  assert.equal(result.message, 'AI适配失败，已切换为本地规则适配');
  assert.equal(fallbackCalls, 1);
});
