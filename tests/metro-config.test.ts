import { spawnSync } from 'child_process';
import { join } from 'path';

// Loading metro.config.js pulls in Expo's ESM-only tooling, so it is evaluated in a plain Node process.
const evaluate = (expression: string): unknown => {
  const run = spawnSync(
    process.execPath,
    ['-e', `const config = require('./metro.config.js'); console.log(JSON.stringify(${expression}))`],
    { cwd: join(__dirname, '..'), encoding: 'utf8' },
  );
  expect(run.status).toBe(0);
  return JSON.parse(run.stdout);
};

describe('metro config', () => {
  it('treats .wasm as an asset so expo-sqlite can bundle on web', () => {
    expect(evaluate('config.resolver.assetExts')).toContain('wasm');
  });

  it('serves cross-origin isolation headers for SharedArrayBuffer', () => {
    const headers = evaluate(`(() => {
      const headers = {};
      config.server.enhanceMiddleware(() => {})({}, { setHeader: (k, v) => { headers[k] = v; } }, () => {});
      return headers;
    })()`);
    expect(headers).toMatchObject({ 'Cross-Origin-Opener-Policy': 'same-origin' });
    expect(headers).toHaveProperty('Cross-Origin-Embedder-Policy');
  });
});
