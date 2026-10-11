import { readdirSync } from 'fs';
import { join, relative } from 'path';

// The production web export is static (ADR-0018) and EAS Hosting serves exactly the files that were
// pre-rendered. Two route shapes broke on the first deployment:
// - dynamic segments such as app/accounts/[id].tsx: any id that was not pre-rendered answers 404;
// - app/<folder>/index.tsx: /<folder> without a trailing slash answers 404.
// Use a static route that reads the id from the query (app/account.tsx, /account?id=...) and name a
// section app/<name>.tsx next to its folder.
const APP = join(__dirname, '..', 'app');

const routeFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? routeFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );

describe('static routes', () => {
  const files = routeFiles(APP).map((file) => relative(APP, file));

  it('sees the route files', () => {
    expect(files).toContain('index.tsx');
    expect(files).toContain('account.tsx');
  });

  it('has no dynamic segments, which the static export cannot serve for unknown ids', () => {
    expect(files.filter((file) => /[\\/]?\[[^\]]+\]/.test(file))).toEqual([]);
  });

  it('has no index.tsx inside a folder, which the hosting only serves with a trailing slash', () => {
    expect(files.filter((file) => /[\\/]index\.tsx?$/.test(file))).toEqual([]);
  });
});
