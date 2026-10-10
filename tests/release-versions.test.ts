import { readFileSync } from 'fs';
import { join } from 'path';

const readJson = (file: string) =>
  JSON.parse(readFileSync(join(__dirname, '..', file), 'utf8'));

describe('release versions', () => {
  it('keeps package.json, app.json and the release manifest on one version', () => {
    const manifest = readJson('.release-please-manifest.json')['.'];
    expect(readJson('package.json').version).toBe(manifest);
    expect(readJson('app.json').expo.version).toBe(manifest);
  });

  it('has release-please bump package.json and app.json', () => {
    const extraFiles = readJson('release-please-config.json').packages['.']['extra-files'];
    expect(extraFiles).toEqual(
      expect.arrayContaining([
        { type: 'json', path: 'package.json', jsonpath: '$.version' },
        { type: 'json', path: 'app.json', jsonpath: '$.expo.version' },
      ]),
    );
  });
});
