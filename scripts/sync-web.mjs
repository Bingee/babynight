import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');

const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'sw.js',
  'manifest.webmanifest'
];

const directoriesToCopy = ['images'];
const directoriesToRemove = ['audio'];

await mkdir(outputDir, { recursive: true });

for (const file of filesToCopy) {
  await cp(path.join(projectRoot, file), path.join(outputDir, file), { force: true });
}

for (const directory of directoriesToCopy) {
  const sourceDir = path.join(projectRoot, directory);
  const targetDir = path.join(outputDir, directory);
  await rm(targetDir, { recursive: true, force: true });
  await cp(sourceDir, targetDir, { recursive: true, force: true });
}

for (const directory of directoriesToRemove) {
  await rm(path.join(outputDir, directory), { recursive: true, force: true });
}

console.log(`Synced web assets to ${path.relative(projectRoot, outputDir)}`);
