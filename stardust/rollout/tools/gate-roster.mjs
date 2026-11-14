// Builds the gate-all roster (a state-shaped file) from coverage: every page whose delivery is
// deployed / verified / failed becomes { status: 'deployed', liveUrl: deployedUrl }.
// usage: node stardust/rollout/tools/gate-roster.mjs [--out stardust/rollout/gate-state.json] [--only a,b]
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
const args = process.argv.slice(2);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const out = val('--out', 'stardust/rollout/gate-state.json');
const only = val('--only', '') ? val('--only').split(',') : null;
const cov = JSON.parse(readFileSync('stardust/rollout/coverage/pages.json', 'utf8'));
const pages = [];
for (const p of cov.pages) {
  if (!['deployed', 'verified', 'failed'].includes(p.delivery?.status) || !p.delivery.deployedUrl) continue;
  if (only && !only.includes(p.slug)) continue;
  const metaPath = `stardust/migrated/${p.path === '/' ? '' : p.path.slice(1)}${p.path === '/' ? '_meta.json' : '._meta.json'}`;
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
  pages.push({ slug: p.slug, url: p.source.sourceUrl, status: 'deployed', liveUrl: p.delivery.deployedUrl, deployedPath: p.path,
    template: meta.template || meta.archetypeSource || p.slug, fidelityTier: meta.fidelityTier || 'sibling' });
}
writeFileSync(out + '.tmp', JSON.stringify({ _provenance: { writtenBy: 'stardust/rollout/tools/gate-roster.mjs', writtenAt: new Date().toISOString() }, pages }, null, 2) + '\n');
renameSync(out + '.tmp', out);
console.log(`gate-roster: ${pages.length} deployed pages → ${out}`);
