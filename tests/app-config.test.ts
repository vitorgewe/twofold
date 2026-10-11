import { readFileSync } from 'fs';
import { join } from 'path';

// app.config.js is plain CommonJS with no Expo imports, so it loads directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withWebOutput = require('../app.config.js') as (context: { config: Record<string, any> }) => Record<string, any>;

const base = JSON.parse(readFileSync(join(__dirname, '..', 'app.json'), 'utf8')).expo as Record<string, any>;

describe('app config', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('exports static web output in production, so the isolation headers reach the hosting manifest', () => {
    process.env.NODE_ENV = 'production';
    expect(withWebOutput({ config: base }).web.output).toBe('static');
  });

  it('keeps single web output for the dev server', () => {
    process.env.NODE_ENV = 'development';
    expect(withWebOutput({ config: base }).web.output).toBe('single');
  });

  it('changes nothing else in app.json, and the cross-origin headers stay on the expo-router plugin', () => {
    process.env.NODE_ENV = 'production';
    const resolved = withWebOutput({ config: base });
    expect({ ...resolved, web: undefined }).toEqual({ ...base, web: undefined });
    const router = (base.plugins as unknown[]).find((p) => Array.isArray(p) && p[0] === 'expo-router') as unknown[];
    expect((router[1] as { headers: Record<string, string> }).headers).toEqual({
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    });
  });
});
