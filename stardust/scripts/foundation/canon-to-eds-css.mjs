// Convert line ranges of the replica canon CSS into EDS-lintable CSS: class names to kebab-case
// (stylelint selector-class-pattern), optional block scope prefix (`header` / `footer`),
// one declaration per line. Values are untouched (stylelint --fix modernises notation).
// Usage: node stardust/scripts/foundation/canon-to-eds-css.mjs [--prefix header] \
//          <file.css>:<from>-<to> [<file.css>:<from>-<to> …]   (prints to stdout)
import { readFileSync } from 'fs';
import postcss from 'postcss';

const args = process.argv.slice(2);
let prefix = '';
const chunks = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--prefix') { prefix = args[i + 1]; i += 1; } else chunks.push(args[i]);
}

// names whose mechanical kebab-case would collide with another canon class
const OVERRIDES = {
  Icon: 'svg-icon',
  icon: 'with-icon', // .Input.icon modifier
  'Topbar--mainNavigation': 'topbar-main-nav',
  'Topbar--search': 'topbar-search-slot',
};
export const kebab = (c) => OVERRIDES[c] || c.replace(/--/g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

let css = '';
for (const c of chunks) {
  const [file, range] = c.split(':');
  const [from, to] = range.split('-').map(Number);
  css += `${readFileSync(file, 'utf8').split('\n').slice(from - 1, to).join('\n')}\n`;
}
const root = postcss.parse(css);
root.walkComments((c) => c.remove());
root.walkRules((rule) => {
  rule.selectors = rule.selectors.map((sel) => {
    let s = sel.replace(/\.([A-Za-z][A-Za-z0-9_-]*)/g, (m, c) => `.${kebab(c)}`);
    s = s.replace(/(^|[^:]):(after|before)\b/g, '$1::$2');
    if (prefix && !/^(html|:root|body)\b/.test(s)) s = `${prefix} ${s}`;
    return s;
  });
});
const depthOf = (n) => { let d = 0; let p = n.parent; while (p && p.type !== 'root') { d += 1; p = p.parent; } return d; };
root.walk((n) => {
  const ind = '  '.repeat(depthOf(n));
  if (n.type === 'decl') {
    n.raws.before = `\n${ind}`;
    n.raws.between = ': ';
  } else if (n.type === 'rule' || n.type === 'atrule') {
    n.raws.before = n.prev() || n.parent.type !== 'root' ? `\n\n${ind}` : '';
    if (n.type === 'rule') n.selector = n.selectors.join(`,\n${ind}`);
    n.raws.between = ' ';
    n.raws.after = `\n${ind}`;
    n.raws.semicolon = true;
    if (n.type === 'atrule') n.raws.afterName = ' ';
  }
});
root.walkAtRules((a) => { if (a.first) a.first.raws.before = `\n${'  '.repeat(depthOf(a.first))}`; });
root.walkRules((r) => { if (r.parent.type !== 'root' && r.parent.first === r) r.raws.before = `\n${'  '.repeat(depthOf(r))}`; });
process.stdout.write(`${root.toString().trim()}\n`);
