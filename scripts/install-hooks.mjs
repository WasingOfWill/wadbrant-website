#!/usr/bin/env node
/**
 * Points git at the tracked hooks in .githooks. Runs automatically after
 * `npm install` through the prepare script, so nobody has to remember.
 *
 * Failure is not fatal: installs from a tarball or outside a git checkout
 * simply have no hooks to install.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'ignore',
});

if (result.status === 0) console.log('git hooks: .githooks');
