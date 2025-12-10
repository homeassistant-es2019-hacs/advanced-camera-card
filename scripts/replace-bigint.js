#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function replaceBigIntLiterals(src) {
  // Match bigint literals like: 123n, 1_000n, 0xFFn, 0b101n, 0o77n
  // We capture an optional prefix char to avoid replacing inside identifiers.
  return src.replace(/(^|[^\w$])((?:0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|[0-9][0-9_]*))n\b/g, (m, prefix, lit) => {
    const cleaned = lit.replace(/_/g, '');
    return prefix + 'Number(' + cleaned + ')';
  });
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(full);
    else if (ent.isFile() && full.endsWith('.js')) {
      let src = fs.readFileSync(full, 'utf8');
      const out = replaceBigIntLiterals(src);
      if (out !== src) {
        fs.writeFileSync(full, out, 'utf8');
        console.log('patched BigInt in', full);
      }
    }
  }
}

const dist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist directory not found, skipping replace-bigint');
  process.exit(0);
}
walkDir(dist);
console.log('replace-bigint completed');
