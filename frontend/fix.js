const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let fixedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Fix \` to `
  content = content.replace(/\\`/g, '`');
  // Fix \${ to ${
  content = content.replace(/\\\${/g, '${');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log('Fixed', file);
  }
});

console.log('Total fixed files:', fixedCount);
