import { promises as fs } from 'fs';
import path from 'path';

const distCssPath = path.resolve('dist/styles.css');
const rootCssPath = path.resolve('styles.css');

async function copyStyles() {
  try {
    await fs.access(distCssPath);
  } catch (err) {
    console.warn(`[copy-styles] ${distCssPath} not found, skipping copy.`);
    return;
  }

  await fs.copyFile(distCssPath, rootCssPath);
  console.log(`[copy-styles] Copied ${distCssPath} -> ${rootCssPath}`);
}

copyStyles().catch((error) => {
  console.error('[copy-styles] Failed to copy styles.css:', error);
  process.exit(1);
});

