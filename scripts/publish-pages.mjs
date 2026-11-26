// GitHub Pages publica main desde la raíz del repositorio.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// El material publicado permite reconstruir el sitio después de clonar.
if (!existsSync(join(root, 'public/media/img'))) {
  mkdirSync(join(root, 'public'), { recursive: true });
  cpSync(join(root, 'media'), join(root, 'public/media'), { recursive: true });
}
const build = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: root, stdio: 'inherit',
  env: { ...process.env, STATIC: '1', BASE_PATH: '/fucodemo' },
});
if (build.status !== 0) process.exit(build.status || 1);
for (const name of readdirSync(join(root, 'dist'))) {
  cpSync(join(root, 'dist', name), join(root, name), { recursive: true });
}
console.log('Publicación preparada. Incluye data/site.es.json y data/site.en.json en el commit.');
