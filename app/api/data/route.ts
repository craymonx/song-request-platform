import { ensureDatabase, getD1 } from '@/db';

export const runtime = 'edge';

const json = (data: unknown, status = 200) => Response.json(data, { status });

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const d1 = getD1();
    const view = new URL(request.url).searchParams.get('view') ?? 'songs';

    const songsQuery = d1.prepare(
      'SELECT id, title, artist, language, category, key, notes, enabled, created_at AS createdAt FROM songs WHERE enabled = 1 ORDER BY title COLLATE NOCASE',
    );

    if (view === 'songs') {
      const songs = await songsQuery.all();
      return json({ songs: songs.results });
    }

    if (view === 'dashboard') {
      const [songs, requests, performances] = await Promise.all([
        songsQuery.all(),
        d1.prepare(
          `SELECT r.id, r.song_id AS songId, r.custom_title AS customTitle,
            r.custom_artist AS customArtist, r.nickname, r.message, r.status,
            r.priority, r.created_at AS createdAt, r.updated_at AS updatedAt,
            s.title AS songTitle, s.artist AS songArtist, s.category
           FROM requests r LEFT JOIN songs s ON s.id = r.song_id
           WHERE r.event_id = ?
           ORDER BY CASE r.status WHEN 'up_next' THEN 0 WHEN 'new' THEN 1 ELSE 2 END,
                    r.priority DESC, r.created_at DESC`,
        ).bind('main-event').all(),
        d1.prepare(
          `SELECT id, song_id AS songId, request_id AS requestId, title, artist,
            performed_at AS performedAt FROM performances
           WHERE event_id = ? ORDER BY performed_at DESC LIMIT 200`,
        ).bind('main-event').all(),
      ]);
      return json({ songs: songs.results, requests: requests.results, performances: performances.results });
    }

    return json({ error: 'Unknown view' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Unable to load data' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const d1 = getD1();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? '');
    const now = new Date().toISOString();

    if (action === 'createRequest') {
      const nickname = String(body.nickname ?? '').trim();
      const message = String(body.message ?? '').trim();
      const customTitle = String(body.customTitle ?? '').trim();
      const customArtist = String(body.customArtist ?? '').trim();
      const songId = body.songId ? Number(body.songId) : null;

      if (!nickname || nickname.length > 30) return json({ error: 'Nickname is required and must be 30 characters or fewer.' }, 400);
      if (message.length > 300) return json({ error: 'Message must be 300 characters or fewer.' }, 400);
      if (!songId && !customTitle) return json({ error: 'Please choose or enter a song.' }, 400);
      if (customTitle.length > 100 || customArtist.length > 100) return json({ error: 'Custom song information is too long.' }, 400);
      if (songId) {
        const song = await d1.prepare('SELECT id FROM songs WHERE id = ? AND enabled = 1').bind(songId).first();
        if (!song) return json({ error: 'That song is no longer available.' }, 400);
      }

      const id = crypto.randomUUID();
      await d1.prepare(
        `INSERT INTO requests (id, event_id, song_id, custom_title, custom_artist, nickname, message, status, priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 0, ?, ?)`,
      ).bind(id, 'main-event', songId, customTitle, customArtist, nickname, message, now, now).run();
      return json({ ok: true, id }, 201);
    }

    if (action === 'updateRequest') {
      const ids = Array.isArray(body.ids)
        ? body.ids.map(String).filter(Boolean).slice(0, 50)
        : body.id ? [String(body.id)] : [];
      const id = ids[0] ?? '';
      const status = String(body.status ?? '');
      if (!id || !['new', 'up_next', 'skipped'].includes(status)) return json({ error: 'Invalid request update.' }, 400);
      if (status === 'up_next') {
        await d1.batch([
          d1.prepare("UPDATE requests SET status = 'new', updated_at = ? WHERE event_id = ? AND status = 'up_next'").bind(now, 'main-event'),
          d1.prepare("UPDATE requests SET status = 'up_next', priority = ?, updated_at = ? WHERE id = ? AND status != 'performed'").bind(Date.now(), now, id),
        ]);
      } else {
        await d1.batch(ids.map((requestId) => d1.prepare('UPDATE requests SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, requestId)));
      }
      return json({ ok: true });
    }

    if (action === 'markPerformed') {
      const requestIds = Array.isArray(body.requestIds)
        ? body.requestIds.map(String).filter(Boolean).slice(0, 50)
        : body.requestId ? [String(body.requestId)] : [];
      const requestId = requestIds[0] ?? null;
      const songId = body.songId ? Number(body.songId) : null;
      let title = '';
      let artist = '';

      if (requestId) {
        const row = await d1.prepare(
          `SELECT r.song_id AS songId, COALESCE(s.title, r.custom_title) AS title,
            COALESCE(s.artist, r.custom_artist) AS artist
           FROM requests r LEFT JOIN songs s ON s.id = r.song_id WHERE r.id = ?`,
        ).bind(requestId).first<{ songId: number | null; title: string; artist: string }>();
        if (!row) return json({ error: 'Request not found.' }, 404);
        title = row.title;
        artist = row.artist;
      } else if (songId) {
        const row = await d1.prepare('SELECT title, artist FROM songs WHERE id = ?').bind(songId).first<{ title: string; artist: string }>();
        if (!row) return json({ error: 'Song not found.' }, 404);
        title = row.title;
        artist = row.artist;
      } else {
        return json({ error: 'Song or request is required.' }, 400);
      }

      const performanceId = crypto.randomUUID();
      const operations = [
        d1.prepare('INSERT INTO performances (id, event_id, song_id, request_id, title, artist, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(performanceId, 'main-event', songId, requestId, title, artist, now),
      ];
      for (const fulfilledRequestId of requestIds) {
        operations.push(d1.prepare('INSERT INTO performance_requests (performance_id, request_id) VALUES (?, ?)').bind(performanceId, fulfilledRequestId));
        operations.push(d1.prepare("UPDATE requests SET status = 'performed', updated_at = ? WHERE id = ?").bind(now, fulfilledRequestId));
      }
      await d1.batch(operations);
      return json({ ok: true, id: performanceId });
    }

    if (action === 'undoPerformance') {
      const id = String(body.id ?? '');
      const row = await d1.prepare('SELECT id FROM performances WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Performance not found.' }, 404);
      const linked = await d1.prepare('SELECT request_id AS requestId FROM performance_requests WHERE performance_id = ?').bind(id).all<{ requestId: string }>();
      const operations = [
        d1.prepare('DELETE FROM performance_requests WHERE performance_id = ?').bind(id),
        d1.prepare('DELETE FROM performances WHERE id = ?').bind(id),
      ];
      for (const item of linked.results) operations.push(d1.prepare("UPDATE requests SET status = 'new', updated_at = ? WHERE id = ?").bind(now, item.requestId));
      await d1.batch(operations);
      return json({ ok: true });
    }

    if (action === 'importSongs') {
      const rows = Array.isArray(body.songs) ? body.songs.slice(0, 1000) : [];
      const statements = rows.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const song = item as Record<string, unknown>;
        const title = String(song.title ?? '').trim();
        if (!title || title.length > 150) return [];
        return [d1.prepare('INSERT INTO songs (title, artist, language, category, key, notes, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').bind(title, String(song.artist ?? '').trim().slice(0, 150), String(song.language ?? '').trim().slice(0, 50), String(song.category ?? '').trim().slice(0, 80), String(song.key ?? '').trim().slice(0, 30), String(song.notes ?? '').trim().slice(0, 300), now)];
      });
      if (!statements.length) return json({ error: 'No valid songs found in the file.' }, 400);
      await d1.batch(statements);
      return json({ ok: true, imported: statements.length });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Unable to save changes' }, 500);
  }
}
