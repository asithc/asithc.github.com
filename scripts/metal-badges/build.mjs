import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = new URL('../../', import.meta.url);
await build({
    entryPoints: [fileURLToPath(new URL('entry.jsx', import.meta.url))],
    outfile: fileURLToPath(new URL('js/vendor/metal-badges/metal-badges.min.js', root)),
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'linked'
});
