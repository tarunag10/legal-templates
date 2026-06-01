import fs from 'node:fs';
const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<main')) throw new Error('Missing <main landmark');
if (!html.includes('<label') && !html.includes('aria-label') && !html.includes('aria-labelledby')) {
  throw new Error('Missing accessible labelling marker');
}
if (!html.includes('aria-')) throw new Error('Missing ARIA marker for dynamic UI');
console.log('Static accessibility smoke check passed');
