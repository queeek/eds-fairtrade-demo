#!/usr/bin/env node
/**
 * cluster-landing encoder (template archetype: index → content/index.html).
 * Siblings: us-en-html → content/us-en.html.
 *
 *   node stardust/rollout/encoders/cluster-landing.mjs            # write sibling docs
 *   node stardust/rollout/encoders/cluster-landing.mjs --verify   # re-encode the archetype
 *        to a temp file and compare with content/index.html (never overwrites it)
 */
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeSlug, ROOT } from './common.mjs';

const SIBLINGS = ['us-en-html'];

if (process.argv.includes('--verify')) {
  const out = join(tmpdir(), 'cluster-landing-index.html');
  encodeSlug('index', { out });
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  const same = norm(readFileSync(out, 'utf8')) === norm(readFileSync(join(ROOT, 'content/index.html'), 'utf8'));
  console.log(`archetype index re-encode → ${out}: ${same ? 'EQUIVALENT' : 'DIFFERS'}`);
  process.exit(same ? 0 : 1);
}

for (const slug of SIBLINGS) {
  const { out, modules } = encodeSlug(slug);
  console.log(`${slug} → ${out.replace(`${ROOT}/`, '')} [${modules.join(', ')}]`);
}
