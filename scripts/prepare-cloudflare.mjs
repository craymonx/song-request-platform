import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../dist/server/wrangler.json', import.meta.url);
const config = JSON.parse(await readFile(configPath, 'utf8'));

config.name = 'cantomooncouver-song-requests';
config.compatibility_flags = [...new Set(config.compatibility_flags ?? [])];
config.workers_dev = true;
config.preview_urls = true;
config.d1_databases = [
  {
    binding: 'DB',
    database_name: 'cantomooncouver-song-requests',
    database_id: '73b63e70-a8bd-4885-90ac-e1137bf62c70',
  },
];

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
