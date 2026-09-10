#!/usr/bin/env node
/* Copy self-hosted woff2 (src/assets/fonts) into public/fonts so Astro emits them at /fonts/. */
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const src = 'src/assets/fonts', dst = 'public/fonts';
mkdirSync(dst, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  if (f.endsWith('.woff2')) { cpSync(join(src, f), join(dst, f)); n++; }
}
console.log(`copy-fonts: ${n} woff2 -> public/fonts/`);
