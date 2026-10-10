import { readFileSync } from 'fs';
import { join } from 'path';

describe('metro config', () => {
  it('treats .wasm as an asset so expo-sqlite can bundle on web', () => {
    const source = readFileSync(join(__dirname, '..', 'metro.config.js'), 'utf8');
    expect(source).toMatch(/assetExts\.push\(\s*['"]wasm['"]\s*\)/);
  });
});
