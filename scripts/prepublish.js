import fs from 'node:fs/promises';
import pkg from '../package.json' assert { type: 'json' };

const url = new URL('../dist/version.js', import.meta.url);
const content = await fs.readFile(url, 'utf8');
const updatedContent = content.replace('__VERSION__', `v${pkg.version}`);
await fs.writeFile(url, updatedContent);
