import { existsSync, readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = relative => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const check = process.argv.includes('--check');
let drift = false;
function writeAtomic(target, expected) {
  const temporary = `${target}.ui-sync-${process.pid}`;
  try {
    writeFileSync(temporary, expected);
    renameSync(temporary, target);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}
function sync(relative, expected) {
  if (existsSync(path.join(root, relative)) && read(relative) === expected) return;
  if (check) { console.error(`UI drift: ${relative}`); drift = true; }
  else writeAtomic(path.join(root, relative), expected);
}

for (const [source, destination] of [
  ['frontend/src/styles/mockup-tokens.css', 'mockups/shared/tokens.css'],
  ['frontend/src/styles/mockup-base.css', 'mockups/shared/base.css'],
  ['frontend/src/styles/mockup-components.css', 'mockups/shared/components.css'],
  ['frontend/src/styles/learning-refinements.css', 'mockups/shared/learning-refinements.css'],
  ['frontend/src/styles/deck-illustrations.css', 'mockups/shared/deck-illustrations.css'],
]) sync(destination, read(source));
// The homepage uses the same authored stylesheet in CSS Modules and static HTML.
const homeClasses = {
  heroSheet: 'hero-sheet', heroGrid: 'hero-grid', ctaRow: 'cta-row', fillGrid: 'fill-grid', fillRow: 'fill-row',
  quizHead: 'quiz-head', quizBody: 'quiz-body', quizPrompt: 'quiz-prompt', quizPromptVi: 'quiz-prompt.vi',
  quizSub: 'quiz-sub', quizOptions: 'quiz-options', quizFoot: 'quiz-foot', quizBodySwap: 'quiz-body-swap',
  schedGrid: 'sched-grid', schedHead: 'sched-head', btnOnDark: 'btn-on-dark',
};
const homeCss = read('frontend/src/app/(public)/page.module.css').replace(/:global\((\.[\w-]+)\)/g, '$1')
  .replace(/\.([a-zA-Z][\w-]*)/g, (match, name) => homeClasses[name] ? `.${homeClasses[name]}` : match);
sync('mockups/shared/public-learning.css', homeCss);
sync('mockups/shared/speech.js', read('frontend/public/speech.js'));
sync('mockups/shared/theme.js', read('frontend/public/theme.js'));
sync('mockups/shared/mascot.js', read('frontend/public/mascot.js'));
sync('mockups/shared/mascot.svg', read('frontend/public/mascot.svg'));
sync('mockups/shared/mascot.css', read('frontend/src/styles/mascot.css'));
sync('frontend/public/shared/assets/mascot-mark.svg', read('frontend/public/mascot.svg'));
sync('mockups/shared/assets/mascot-mark.svg', read('frontend/public/mascot.svg'));
sync('frontend/public/shared/assets/favicon.svg', read('frontend/public/mascot.svg'));
sync('mockups/shared/assets/favicon.svg', read('frontend/public/mascot.svg'));

// Author SVG geometry once in Icon.js. No copied icon library or runtime dependency.
const iconSource = read('frontend/src/components/ui/Icon.js').split('export function Icon')[0];
const entries = [...iconSource.matchAll(/^  (?:'([^']+)'|(\w+)): <g>(.*?)<\/g>,?$/gm)]
  .map(([, quoted, name, svg]) => `    ${JSON.stringify(quoted || name)}: ${JSON.stringify(svg)}`);
if (!entries.length) throw new Error('No icons found; refusing to overwrite mockup icons.');
const app = read('mockups/shared/app.js');
sync('mockups/shared/app.js', app.replace(/  const ICONS = \{[\s\S]*?\n  \};/, `  const ICONS = {\n${entries.join(',\n')}\n  };`));
const todayClasses = {startFoot:'start-foot',rescueLead:'rescue-lead',planList:'plan-list',deckMini:'deck-mini',goalLine:'goal-line'};
const todayCss = read('frontend/src/app/(app)/hom-nay/page.module.css').replace(/:global\((\.[\w-]+)\)/g, '$1').replace(/\.([a-zA-Z][\w-]*)/g, (match,name)=>todayClasses[name]?`.${todayClasses[name]}`:match);
const walk = directory => readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
for (const file of walk('mockups').filter(file => file.endsWith('.html'))) {
  let html = read(file);
  if(file==='mockups/dot2/hom-nay.html')html=html.replace(/<style>[\s\S]*?<\/style>/,`<style>\n${todayCss}</style>`);
  const prefix = file === 'mockups/index.html' ? 'shared/' : '../shared/';
  if (!html.includes(`${prefix}speech.js`)) html=html.replace('</head>',`<script src="${prefix}speech.js"></script>\n</head>`);
  if (!html.includes(`${prefix}mascot.js`)) html=html.replace('</body>',`<script src="${prefix}mascot.js"></script>\n</body>`);
  if (!html.includes(`${prefix}mascot.css`)) html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}mascot.css">\n</head>`);
  if (!html.includes(`${prefix}theme.js`)) html = html.replace('</head>', `<script src="${prefix}theme.js"></script>\n</head>`);
  if (html.includes('shared/components.css') && !html.includes('shared/learning-refinements.css')) {
    console.error(`Missing shared stylesheet: ${file}`); drift = true;
  }
  // Changing a shared asset invalidates browser caches in every mockup.
  if (file.startsWith('mockups/dot3/')) {
    html = html.replace(/(ui\.(?:css|js))(?:\?v=[a-f0-9]+)?(?=["'])/g, (match, name) => {
      const hash = createHash('sha256').update(readFileSync(path.join(root, 'mockups/dot3', name))).digest('hex').slice(0, 12);
      return `${name}?v=${hash}`;
    });
  }
  html = html.replace(/((?:\.\.\/)*shared\/((?:assets\/images\/)?[\w-]+\.(?:css|js|png)))(?:\?v=[a-f0-9]+)?(?=["'])/g, (match, url, name) => {
    const asset = `mockups/shared/${name}`;
    if (!existsSync(path.join(root, asset))) return match;
    const hash = createHash('sha256').update(readFileSync(path.join(root, asset))).digest('hex').slice(0, 12);
    return `${url}?v=${hash}`;
  });
  sync(file, html);
}
process.exitCode = drift ? 1 : 0;
