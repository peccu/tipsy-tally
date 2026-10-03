import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Emits sw.js with the full list of build outputs + public files,
 * so the app works offline right after the first visit.
 */
function serviceWorker(): Plugin {
  const publicDir = 'public';
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

  return {
    name: 'donndake-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const assets = [
        './',
        ...Object.keys(bundle).filter((f) => !f.endsWith('.map')),
        ...walk(publicDir).map((p) => relative(publicDir, p).split('\\').join('/')),
      ].filter((f) => f !== 'sw.js');
      const version = Date.now().toString(36);
      const source = `const VERSION = ${JSON.stringify(version)};
const ASSETS = ${JSON.stringify(assets)};
const CACHE = 'donndake-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('donndake-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  // Relative base so the build works under any GitHub Pages sub-path.
  base: './',
  plugins: [preact(), serviceWorker()],
  define: {
    __APP_VERSION__: JSON.stringify(
      `${process.env.npm_package_version ?? '1.0.0'} (${new Date().toISOString().slice(0, 10)})`,
    ),
  },
  build: { target: 'es2020' },
});
