'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  Check,
  CheckCircle2,
  Clock3,
  History,
  ListMusic,
  LoaderCircle,
  Music2,
  RotateCcw,
  Search,
  SkipForward,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Song = { id: number; title: string; artist: string; language: string; category: string; key: string; notes: string };
type SongRequest = { id: string; songId: number | null; customTitle: string; customArtist: string; nickname: string; message: string; status: string; priority: number; createdAt: string; songTitle: string | null; songArtist: string | null; category: string | null };
type Performance = { id: string; songId: number | null; requestId: string | null; title: string; artist: string; performedAt: string };
type DashboardData = { songs: Song[]; requests: SongRequest[]; performances: Performance[] };
type RequestGroup = { key: string; title: string; artist: string; category: string; custom: boolean; requests: SongRequest[] };

const statusLabels: Record<string, string> = {
  new: '新點唱 · New',
  up_next: '下一首 · Up next',
  performed: '已演唱 · Performed',
  skipped: '略過 · Skipped',
};

function parseCsv(text: string) {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field.trim());
      if (row.some(Boolean)) lines.push(row);
      row = []; field = '';
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) lines.push(row);
  if (lines.length < 2) return [];
  const headers = lines[0].map((header) => header.toLowerCase().replace(/^\ufeff/, ''));
  return lines.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function PerformerPage() {
  const [data, setData] = useState<DashboardData>({ songs: [], requests: [], performances: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const loadDashboard = useCallback(async (quiet = false) => {
    try {
      const response = await fetch('/api/data?view=dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      setData(await response.json());
    } catch {
      if (!quiet) setNotice('暫時未能載入資料 · Unable to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = window.setInterval(() => loadDashboard(true), 3000);
    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const mutate = async (payload: Record<string, unknown>, key: string) => {
    setBusy(key);
    setNotice('');
    try {
      const response = await fetch('/api/data', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; imported?: number };
      if (!response.ok) throw new Error(result.error || 'Update failed');
      if (result.imported) setNotice(`已匯入 ${result.imported} 首歌 · ${result.imported} songs imported`);
      await loadDashboard(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update');
    } finally {
      setBusy('');
    }
  };

  const activeGroups = useMemo(() => {
    const groups = new Map<string, RequestGroup>();
    data.requests.filter((item) => item.status === 'new' || item.status === 'up_next').forEach((item) => {
      const title = item.songTitle || item.customTitle;
      const artist = item.songArtist || item.customArtist;
      const key = item.songId ? `song-${item.songId}` : `custom-${title.toLocaleLowerCase()}-${artist.toLocaleLowerCase()}`;
      const group = groups.get(key) ?? { key, title, artist, category: item.category || '', custom: !item.songId, requests: [] };
      group.requests.push(item);
      groups.set(key, group);
    });
    return Array.from(groups.values()).sort((a, b) => {
      const aNext = a.requests.some((item) => item.status === 'up_next') ? 1 : 0;
      const bNext = b.requests.some((item) => item.status === 'up_next') ? 1 : 0;
      return bNext - aNext || new Date(b.requests[0].createdAt).getTime() - new Date(a.requests[0].createdAt).getTime();
    });
  }, [data.requests]);

  const filteredSongs = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return data.songs.filter((song) => !needle || `${song.title} ${song.artist} ${song.category}`.toLocaleLowerCase().includes(needle));
  }, [data.songs, search]);

  const performedSongIds = useMemo(() => new Set(data.performances.map((item) => item.songId).filter(Boolean)), [data.performances]);
  const newCount = data.requests.filter((item) => item.status === 'new').length;
  const nextGroup = activeGroups.find((group) => group.requests.some((item) => item.status === 'up_next'));

  const handleImport = async (file?: File) => {
    if (!file) return;
    const songs = parseCsv(await file.text());
    await mutate({ action: 'importSongs', songs }, 'import');
  };

  return (
    <main className="min-h-screen bg-[#140f14] text-[#f8f3f6]">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#140f14]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <img src="/cantomooncouver-logo.png" alt="歡樂滿歌華" className="h-11 w-auto sm:h-13" />
            <div className="hidden border-l border-white/12 pl-4 sm:block"><p className="text-sm font-bold">表演者工作台</p><p className="text-xs text-white/45">Performer dashboard</p></div>
          </div>
          <div className="flex items-center gap-2"><span className="hidden items-center gap-2 text-xs text-white/45 md:flex"><span className="size-2 animate-pulse rounded-full bg-emerald-400" />每 3 秒更新</span><a href="/" className="rounded-full border border-white/12 px-4 py-2 text-xs font-bold text-white/75 hover:bg-white/8">觀眾頁面 · Audience</a></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ed4fa0]/25 bg-gradient-to-br from-[#602044]/65 to-[#281522] p-5"><div className="flex items-center justify-between"><p className="text-sm text-[#efb4d2]">新點唱 · New</p><Users className="size-5 text-[#ef6eae]" /></div><p className="mt-2 text-4xl font-black">{newCount}</p></div>
          <div className="rounded-2xl border border-[#9c62d8]/25 bg-gradient-to-br from-[#3d2457]/70 to-[#201526] p-5"><div className="flex items-center justify-between"><p className="text-sm text-[#d6b9f0]">下一首 · Up next</p><Sparkles className="size-5 text-[#c38aef]" /></div><p className="mt-2 truncate text-2xl font-black">{nextGroup?.title || '尚未選擇'}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5"><div className="flex items-center justify-between"><p className="text-sm text-white/55">今晚已唱 · Performed</p><CheckCircle2 className="size-5 text-emerald-400" /></div><p className="mt-2 text-4xl font-black">{data.performances.length}</p></div>
        </div>

        {notice && <div role="status" className="mb-5 rounded-xl border border-[#d95b99]/25 bg-[#4c2038]/60 px-4 py-3 text-sm text-[#f4c5dc]">{notice}</div>}

        <Tabs defaultValue="requests" className="gap-6">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-white/[.055] p-1.5 sm:w-fit">
            <TabsTrigger value="requests" className="h-10 min-w-max rounded-xl px-4 text-white/55 data-active:bg-[#d63286] data-active:text-white"><Users />點唱 Requests</TabsTrigger>
            <TabsTrigger value="songs" className="h-10 min-w-max rounded-xl px-4 text-white/55 data-active:bg-[#d63286] data-active:text-white"><ListMusic />歌單 Songs</TabsTrigger>
            <TabsTrigger value="history" className="h-10 min-w-max rounded-xl px-4 text-white/55 data-active:bg-[#d63286] data-active:text-white"><History />歷史 History</TabsTrigger>
            <TabsTrigger value="import" className="h-10 min-w-max rounded-xl px-4 text-white/55 data-active:bg-[#d63286] data-active:text-white"><Upload />匯入 Import</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#e35a9e]" /></div> : activeGroups.length === 0 ? (
              <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[.025] text-center"><div><Music2 className="mx-auto size-9 text-white/25" /><p className="mt-3 text-lg font-bold">等待新點唱</p><p className="mt-1 text-sm text-white/40">Waiting for requests</p></div></div>
            ) : (
              <div className="grid items-start gap-4 xl:grid-cols-2">
                {activeGroups.map((group) => {
                  const isNext = group.requests.some((item) => item.status === 'up_next');
                  return <Card key={group.key} className={`gap-0 rounded-3xl py-0 text-white ring-1 ${isNext ? 'bg-gradient-to-br from-[#5d2148] to-[#30192b] ring-[#f05aa3]/55' : 'bg-[#211a21] ring-white/10'}`}>
                    <CardHeader className="border-b border-white/8 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2">{isNext && <Badge className="bg-[#f05aa3] text-white hover:bg-[#f05aa3]">下一首 · Up next</Badge>}{group.custom && <Badge className="bg-amber-300/15 text-amber-200 hover:bg-amber-300/15">自訂 · Custom</Badge>}{group.requests.length > 1 && <Badge className="bg-white/10 text-white hover:bg-white/10">{group.requests.length} 人點唱</Badge>}</div><CardTitle className="mt-3 text-3xl font-black tracking-tight">{group.title}</CardTitle><p className="mt-1 text-white/50">{group.artist || '未提供歌手'} {group.category && `· ${group.category}`}</p></div><span className="rounded-full bg-white/7 px-3 py-1.5 text-xs text-white/45">{timeLabel(group.requests[0].createdAt)}</span></div></CardHeader>
                    <CardContent className="space-y-2 p-5 sm:p-6">{group.requests.map((item) => <div key={item.id} className="rounded-2xl bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><p className="font-bold text-[#ffcde4]">{item.nickname}</p><span className="text-[11px] text-white/35">{timeLabel(item.createdAt)}</span></div>{item.message && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{item.message}</p>}</div>)}</CardContent>
                    <div className="grid gap-2 border-t border-white/8 p-4 sm:grid-cols-3 sm:p-5">
                      <Button disabled={!!busy || isNext} onClick={() => mutate({ action: 'updateRequest', id: group.requests[0].id, status: 'up_next' }, group.key)} className="h-11 rounded-xl bg-[#8842a4] text-white hover:bg-[#9b52b8]"><ArrowUp />排下一首</Button>
                      <Button disabled={!!busy} onClick={() => mutate({ action: 'markPerformed', requestIds: group.requests.map((item) => item.id), songId: group.requests[0].songId }, group.key)} className="h-11 rounded-xl bg-emerald-500 text-[#092619] hover:bg-emerald-400"><Check />已演唱 Performed</Button>
                      <Button disabled={!!busy} variant="ghost" onClick={() => mutate({ action: 'updateRequest', ids: group.requests.map((item) => item.id), status: 'skipped' }, group.key)} className="h-11 rounded-xl text-white/55 hover:bg-white/8 hover:text-white"><SkipForward />略過 Skip</Button>
                    </div>
                  </Card>;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="songs">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">完整歌單</h2><p className="mt-1 text-sm text-white/40">Full song book · {data.songs.length} songs</p></div><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋歌名或歌手 / Search" className="h-11 rounded-xl border-white/10 bg-white/6 pl-10 text-white placeholder:text-white/30" /></div></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredSongs.map((song) => { const performed = performedSongIds.has(song.id); return <div key={song.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[.045] p-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-lg font-bold">{song.title}</h3>{performed && <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}</div><p className="truncate text-sm text-white/45">{song.artist} {song.key && `· Key ${song.key}`}</p><p className="mt-1 text-xs text-white/30">{song.category || song.language}</p></div><Button disabled={!!busy} variant={performed ? 'ghost' : 'outline'} onClick={() => mutate({ action: 'markPerformed', songId: song.id }, `song-${song.id}`)} className="h-10 shrink-0 rounded-xl border-white/12 bg-transparent text-white/75 hover:bg-white/10 hover:text-white"><Check />{performed ? '再唱' : '已唱'}</Button></div>; })}</div>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-7 xl:grid-cols-2">
              <section><h2 className="text-2xl font-black">演唱紀錄</h2><p className="mt-1 text-sm text-white/40">Performance history</p><div className="mt-4 space-y-2">{data.performances.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/35">尚無紀錄 · No performances yet</p> : data.performances.map((item, index) => <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-white/[.045] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-400/12 font-black text-emerald-300">{data.performances.length - index}</span><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.title}</p><p className="truncate text-xs text-white/40">{item.artist} · {timeLabel(item.performedAt)}</p></div><Button disabled={!!busy} variant="ghost" size="icon" onClick={() => mutate({ action: 'undoPerformance', id: item.id }, item.id)} aria-label="Undo performance" className="text-white/35 hover:bg-white/8 hover:text-white"><RotateCcw /></Button></div>)}</div></section>
              <section><h2 className="text-2xl font-black">點唱歷史</h2><p className="mt-1 text-sm text-white/40">All request history</p><div className="mt-4 space-y-2">{data.requests.map((item) => <div key={item.id} className="rounded-2xl border border-white/7 bg-white/[.035] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{item.songTitle || item.customTitle}</p><Badge className={`${item.status === 'performed' ? 'bg-emerald-400/12 text-emerald-300' : item.status === 'skipped' ? 'bg-white/8 text-white/45' : 'bg-[#d63286]/15 text-[#f58abb]'} hover:bg-inherit`}>{statusLabels[item.status] || item.status}</Badge></div><p className="mt-1 text-xs text-white/40">{item.nickname} · {timeLabel(item.createdAt)}</p>{item.message && <p className="mt-2 line-clamp-2 text-sm text-white/60">{item.message}</p>}</div>)}</div></section>
            </div>
          </TabsContent>

          <TabsContent value="import">
            <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-9"><span className="grid size-13 place-items-center rounded-2xl bg-[#d63286]/15 text-[#ee70ae]"><Upload /></span><h2 className="mt-5 text-3xl font-black">匯入歌單</h2><p className="mt-2 text-white/50">Import song list from a UTF-8 CSV file</p><div className="mt-6 rounded-2xl bg-black/20 p-4 text-sm leading-7 text-white/60"><p className="font-bold text-white/85">必要欄位 · Required</p><code className="text-[#f28abd]">title</code><p className="mt-2 font-bold text-white/85">可選欄位 · Optional</p><code className="break-words text-[#d7a9ef]">artist, language, category, key, notes</code></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d63286] px-5 font-bold text-white transition hover:bg-[#bd2873]"><Upload className="size-4" />{busy === 'import' ? '匯入中…' : '選擇 CSV 檔案'}<input type="file" accept=".csv,text/csv" className="sr-only" disabled={!!busy} onChange={(event) => handleImport(event.target.files?.[0])} /></label><a href="/song-list-template.csv" download className="inline-flex h-12 items-center justify-center rounded-xl border border-white/12 px-5 font-bold text-white/65 hover:bg-white/7">下載範本 · Download template</a></div><p className="mt-4 text-xs text-white/30">匯入會加入現有歌單，不會刪除原有歌曲。 · Imported songs are added to the existing list.</p></div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
