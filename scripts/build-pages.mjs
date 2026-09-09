import { cp, mkdir, rm, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Build an isolated static copy, preserving the local server API and dev build.
const root = process.cwd();
const stage = resolve(root, '.cache/pages');
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
for (const name of ['app', 'components', 'lib', 'public', 'data', 'next.config.ts', 'tsconfig.json', 'next-env.d.ts', 'package.json', 'package-lock.json']) {
  await cp(resolve(root, name), resolve(stage, name), {
    recursive: true,
    filter: source => source !== resolve(root, 'app/api'),
  });
}
await cp(resolve(root, 'data/regulations'), resolve(stage, 'public/regulations'), { recursive: true });
await symlink(resolve(root, 'node_modules'), resolve(stage, 'node_modules'), 'dir');
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
  cwd: stage, stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_STATIC_EXPORT: '1', NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '/demo' },
});
if (result.status !== 0) process.exit(result.status || 1);
await rm(resolve(root, 'out'), { recursive: true, force: true });
await cp(resolve(stage, 'out'), resolve(root, 'out'), { recursive: true });
