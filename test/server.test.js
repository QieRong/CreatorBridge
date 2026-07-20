const assert = require('node:assert/strict');
const test = require('node:test');

let createApp;
try {
  ({ createApp } = require('../server.js'));
} catch (error) {
  createApp = undefined;
}

const validPayload = {
  title: '内容适配工具实践',
  body: '这是一段包含真实事实的原始内容。',
  tags: ['内容创作', '效率工具'],
  platforms: ['wechat', 'xiaohongshu']
};

function createFetchResponse(content) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }]
    })
  };
}

async function postJson(app, path, payload) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('AI 代理返回 OpenRouter 的合法 targets JSON', async () => {
  const app = createApp({
    apiKey: 'test-key',
    model: 'nvidia/test-model',
    fetchImpl: async () => createFetchResponse({
      targets: [
        { platformId: 'wechat', platformName: '公众号', title: '正式标题', body: '正式正文。', tags: ['内容创作'] },
        { platformId: 'xiaohongshu', platformName: '小红书', title: '分享标题', body: '轻松分享。', tags: ['内容创作'] }
      ]
    })
  });

  const response = await postJson(app, '/api/ai-adapt', validPayload);

  assert.equal(response.status, 200);
  assert.equal(response.body.targets.length, 2);
  assert.equal(response.body.targets[0].platformId, 'wechat');
});

test('AI 代理拒绝超长正文且不调用 OpenRouter', async () => {
  let calls = 0;
  const app = createApp({
    apiKey: 'test-key',
    model: 'nvidia/test-model',
    fetchImpl: async () => {
      calls += 1;
      return createFetchResponse({ targets: [] });
    }
  });

  const response = await postJson(app, '/api/ai-adapt', {
    ...validPayload,
    body: 'a'.repeat(12001)
  });

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
  assert.match(response.body.message, /正文/);
});

test('AI 代理在模型返回非法 JSON 时返回安全错误', async () => {
  const app = createApp({
    apiKey: 'test-key',
    model: 'nvidia/test-model',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '不是 JSON' } }] })
    })
  });

  const response = await postJson(app, '/api/ai-adapt', validPayload);

  assert.equal(response.status, 502);
  assert.equal(response.body.error, 'AI_RESPONSE_INVALID');
});

test('AI 代理拒绝标题或正文为空的平台内容', async () => {
  const app = createApp({
    apiKey: 'test-key',
    model: 'nvidia/test-model',
    fetchImpl: async () => createFetchResponse({
      targets: [
        { platformId: 'wechat', platformName: '公众号', title: '有效标题', body: '  ', tags: [] },
        { platformId: 'xiaohongshu', platformName: '小红书', title: '分享标题', body: '轻松分享。', tags: ['内容创作'] }
      ]
    })
  });

  const response = await postJson(app, '/api/ai-adapt', validPayload);

  assert.equal(response.status, 502);
  assert.equal(response.body.error, 'AI_RESPONSE_INVALID');
});

test('AI 代理在请求超时时返回超时错误', async () => {
  const app = createApp({
    apiKey: 'test-key',
    model: 'nvidia/test-model',
    timeoutMs: 10,
    fetchImpl: async () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
  });

  const response = await postJson(app, '/api/ai-adapt', validPayload);

  assert.equal(response.status, 504);
  assert.equal(response.body.error, 'AI_REQUEST_TIMEOUT');
});
