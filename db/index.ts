import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb() {
  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.',
    );
  }

  return drizzle(env.DB, { schema });
}

export function getD1() {
  if (!env.DB) throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  return env.DB;
}

const seedSongs = [
  ['蜚蜚', '陳僖儀', '粵語', ''],
  ['不許你注定一人', 'Dear Jane', '粵語', ''],
  ['絕', '', '粵語', '傅珮嘉'],
  ['分手總約在雨天', '方皓玟', '粵語', ''],
  ['到此為止', '連詩雅', '粵語', ''],
  ['沙龍', '陳奕迅', '粵語', ''],
  ['假使世界原來不像你預期', '方皓玟', '粵語', ''],
  ['追', '張國榮', '粵語', ''],
  ['垃圾', '盧巧音', '粵語', ''],
  ['傾城', '許美靜', '粵語', ''],
  ['不浪漫罪名', '王傑', '粵語', ''],
  ['誰明浪子心', '王傑', '粵語', ''],
  ['勿念', '岑寧兒', '粵語', ''],
  ['錯誤的宇宙尋找愛', '陳健安', '粵語', ''],
  ['木紋', '何韻詩', '粵語', ''],
  ['思覺失調', '劉浩龍', '粵語', ''],
  ['在流浮山滴眼水', 'Serrini', '粵語', ''],
  ['勞斯萊斯', '何韻詩', '粵語', ''],
  ['東京人壽', '容祖兒', '粵語', ''],
  ['山林道', '謝安琪', '粵語', ''],
];

export async function ensureDatabase() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, name TEXT NOT NULL, starts_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)'),
    d1.prepare("CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, artist TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', key TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, event_id TEXT NOT NULL, song_id INTEGER, custom_title TEXT NOT NULL DEFAULT '', custom_artist TEXT NOT NULL DEFAULT '', nickname TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', priority INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS performances (id TEXT PRIMARY KEY, event_id TEXT NOT NULL, song_id INTEGER, request_id TEXT, title TEXT NOT NULL, artist TEXT NOT NULL DEFAULT '', performed_at TEXT NOT NULL)"),
    d1.prepare('CREATE TABLE IF NOT EXISTS performance_requests (performance_id TEXT NOT NULL, request_id TEXT NOT NULL)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_songs_enabled_title ON songs (enabled, title)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_requests_event_status_created ON requests (event_id, status, created_at)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_requests_song_id ON requests (song_id)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_performances_event_date ON performances (event_id, performed_at)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_performance_requests_performance ON performance_requests (performance_id)'),
    d1.prepare('CREATE INDEX IF NOT EXISTS idx_performance_requests_request ON performance_requests (request_id)'),
  ]);

  const now = new Date().toISOString();
  await d1.prepare('INSERT OR IGNORE INTO events (id, name, starts_at, active) VALUES (?, ?, ?, 1)').bind('main-event', 'Cantomooncouver Live', now).run();
  const count = await d1.prepare('SELECT COUNT(*) AS count FROM songs').first<{ count: number }>();
  if (!count?.count) {
    await d1.batch(seedSongs.map((song) => d1.prepare('INSERT INTO songs (title, artist, language, category, created_at) VALUES (?, ?, ?, ?, ?)').bind(song[0], song[1], song[2], song[3], now)));
  }
}
