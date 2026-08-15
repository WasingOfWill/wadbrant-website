/**
 * Runs every automated check, start to finish, with no human in the loop.
 *
 *   npm run verify      # build, then this
 *   npm test            # this, against an existing build
 *
 * Browser-driven checks need Puppeteer, which is deliberately not a
 * dependency: it downloads a browser and would slow every deploy down. It is
 * installed on demand the first time it is needed.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 4010);
const BASE = `http://localhost:${PORT}`;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Node is invoked directly: its path contains spaces on Windows, and a shell
 * would split it. Only npm needs the shell there.
 */
function run(command, args, env = {}) {
  const needsShell = process.platform === 'win32' && command !== process.execPath;
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: needsShell,
  });
  return result.status === 0;
}

function hasPuppeteer() {
  return fs.existsSync(path.join(process.cwd(), 'node_modules', 'puppeteer'));
}

async function waitForServer(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE, { redirect: 'follow' });
      if (response.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

const results = [];
const record = (name, ok) => {
  results.push({ name, ok });
  console.log(`\n${ok ? 'PASS' : 'FAIL'}  ${name}\n`);
};

// 1. Checks that need no server.
record('style', run(process.execPath, ['tests/style.mjs']));
record('content', run(process.execPath, ['tests/content.mjs']));

// 2. Serve the production build for the rest.
if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
  console.error('No build found. Run `npm run build` first, or use `npm run verify`.');
  process.exit(1);
}

const server = spawn(npm, ['start', '--', '-p', String(PORT)], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
  detached: process.platform !== 'win32',
});

const stopServer = () => {
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']);
    else process.kill(-server.pid);
  } catch {
    // already gone
  }
};

process.on('exit', stopServer);
process.on('SIGINT', () => {
  stopServer();
  process.exit(130);
});

if (!(await waitForServer())) {
  console.error(`Server never came up on ${BASE}`);
  stopServer();
  process.exit(1);
}

record('build output', run(process.execPath, ['tests/build-output.mjs'], { LOCAL: BASE }));

if (!hasPuppeteer()) {
  console.log('Installing Puppeteer for the browser checks (first run only)...');
  run(npm, ['install', '--no-save', 'puppeteer', 'pixelmatch', 'pngjs']);
}

record('interface', run(process.execPath, ['tests/functional.mjs'], { LOCAL: BASE }));
record('contrast', run(process.execPath, ['tests/contrast.mjs'], { LOCAL: BASE }));

stopServer();

const failed = results.filter((result) => !result.ok);
console.log('-'.repeat(52));
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}`);
console.log(`${results.length - failed.length}/${results.length} suites passed`);

process.exit(failed.length ? 1 : 0);
