'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Music2, Search, Send, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Song = { id: number; title: string; artist: string; language: string; category: string };

const sampleSongs: Song[] = [
  { id: 1, title: '蜚蜚', artist: '', language: '粵語', category: '' },
  { id: 2, title: '不許你注定一人', artist: '', language: '粵語', category: '' },
  { id: 3, title: '絕', artist: '', language: '粵語', category: '' },
  { id: 4, title: '分手總約在雨天', artist: '', language: '粵語', category: '' },
  { id: 5, title: '到此為止', artist: '', language: '粵語', category: '' },
  { id: 6, title: '沙龍', artist: '', language: '粵語', category: '' },
  { id: 7, title: '假使世界原來不像你預期', artist: '', language: '粵語', category: '' },
  { id: 8, title: '追', artist: '', language: '粵語', category: '' },
  { id: 9, title: '垃圾', artist: '', language: '粵語', category: '' },
  { id: 10, title: '傾城', artist: '', language: '粵語', category: '' },
  { id: 11, title: '不浪漫罪名', artist: '', language: '粵語', category: '' },
  { id: 12, title: '誰明浪子心', artist: '', language: '粵語', category: '' },
  { id: 13, title: '勿念', artist: '', language: '粵語', category: '' },
  { id: 14, title: '錯誤的宇宙尋找愛', artist: '', language: '粵語', category: '' },
  { id: 15, title: '木紋', artist: '', language: '粵語', category: '' },
  { id: 16, title: '思覺失調', artist: '', language: '粵語', category: '' },
  { id: 17, title: '在流浮山滴眼水', artist: '', language: '粵語', category: '' },
  { id: 18, title: '勞斯萊斯', artist: '', language: '粵語', category: '' },
  { id: 19, title: '東京人壽', artist: '', language: '粵語', category: '' },
  { id: 20, title: '山林道', artist: '', language: '粵語', category: '' },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [songs, setSongs] = useState<Song[]>(sampleSongs);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    fetch('/api/data?view=songs', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => setSongs((result as { songs: Song[] }).songs))
      .catch(() => undefined);
  }, []);

  const filteredSongs = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return songs;
    return songs.filter((song) => `${song.title} ${song.artist}`.toLocaleLowerCase().includes(search));
  }, [query, songs]);

  const scrollToForm = () => window.setTimeout(() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' }), 50);

  const openSong = (song: Song) => {
    setSelectedSong(song);
    setCustomMode(false);
    setSubmitted(false);
    scrollToForm();
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nickname.trim() || (customMode && !customTitle.trim())) return;
    setSubmitting(true);
    setRequestError('');
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'createRequest',
          songId: selectedSong?.id ?? null,
          customTitle: customMode ? customTitle : '',
          customArtist: customMode ? customArtist : '',
          nickname,
          message,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to submit request');
      setSubmitted(true);
      window.setTimeout(() => document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : '點唱送出失敗 · Unable to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(241,85,163,0.18),transparent_34%),radial-gradient(circle_at_92%_20%,rgba(104,42,135,0.12),transparent_30%)]" />

      <header className="relative z-10 border-b border-black/6 bg-[#fffaf7]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <a href="#top" aria-label="Cantomooncouver home">
            <img src="/cantomooncouver-logo.png" alt="歡樂滿歌華 Cantomooncouver" className="h-14 w-auto object-contain sm:h-16" />
          </a>
          <span className="rounded-full bg-[#f8e7ef] px-4 py-2 text-xs font-bold tracking-wide text-[#8b2868]">現場點唱 · LIVE</span>
        </div>
      </header>

      <section id="top" className="relative mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <Badge className="mb-5 h-7 bg-[#f8dbe9] px-3 text-[#7b245f] hover:bg-[#f8dbe9]"><Sparkles /> 現場點唱 · LIVE SONG REQUESTS</Badge>
            <h1 className="max-w-3xl text-balance font-heading text-[clamp(2.7rem,8vw,6.3rem)] font-black leading-[.88] tracking-[-.055em] text-[#24141f]">
              今晚，你想聽
              <span className="block bg-gradient-to-r from-[#d63286] via-[#a32a88] to-[#69247d] bg-clip-text text-transparent">邊首歌？</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#65545f] sm:text-xl">
              搜尋歌單，送上你的點唱和留言。
              <span className="mt-1 block text-base text-[#8b7784]">Find a favourite, add your name, and send it to the stage.</span>
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_24px_70px_rgba(104,35,95,.11)] backdrop-blur-xl sm:p-7">
            <label htmlFor="song-search" className="mb-3 block text-sm font-bold text-[#39202f]">搜尋歌曲 <span className="font-normal text-[#8d7583]">Search songs</span></label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#a58b99]" />
              <Input id="song-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="歌名或歌手 / Song or artist" className="h-14 rounded-2xl border-[#ead8e2] bg-[#fffafc] pl-12 text-base shadow-none focus-visible:border-[#d63286] focus-visible:ring-[#d63286]/15" />
            </div>
            <Button type="button" variant="outline" onClick={() => { setCustomMode(true); setSelectedSong(null); setSubmitted(false); scrollToForm(); }} className="mt-3 h-12 w-full justify-between rounded-2xl border-dashed border-[#d9acc5] bg-transparent px-4 text-[#8b2868] hover:bg-[#fff0f7]">
              <span className="flex items-center gap-2"><Music2 /> 找不到？自訂歌曲</span><span className="text-xs font-normal">Custom song</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a63b79]">Song book</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#291923]">今晚歌單</h2></div>
          <span className="text-sm text-[#8d7583]">{filteredSongs.length} 首 songs</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => (
            <button key={song.id} type="button" onClick={() => openSong(song)} className="group flex min-h-28 items-center justify-between rounded-[1.35rem] border border-[#eadde4] bg-white/75 p-5 text-left shadow-[0_8px_24px_rgba(68,25,49,.04)] transition hover:-translate-y-0.5 hover:border-[#d993b9] hover:bg-white hover:shadow-[0_16px_35px_rgba(117,35,82,.1)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#d63286]/25">
              <span><span className="block text-xl font-black tracking-tight text-[#2e1726]">{song.title}</span>{song.artist && <span className="mt-1 block text-sm text-[#816b78]">{song.artist}</span>}<span className="mt-3 inline-flex rounded-full bg-[#f8edf3] px-2.5 py-1 text-[11px] font-semibold text-[#8b3c69]">{song.category || song.language}</span></span>
              <span className="grid size-10 place-items-center rounded-full bg-[#f7e4ef] text-[#b72f76] transition group-hover:bg-[#d63286] group-hover:text-white"><ChevronRight className="size-5" /></span>
            </button>
          ))}
        </div>
        {filteredSongs.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-[#d9c0cd] bg-white/60 px-6 py-10 text-center"><p className="font-bold text-[#432635]">找不到這首歌</p><p className="mt-1 text-sm text-[#8d7583]">No match found. Try a custom request.</p></div>}
      </section>

      {(selectedSong || customMode) && (
        <section id="request-form" className="relative border-t border-[#eadde4] bg-[#2a1724] px-5 py-14 text-white sm:px-8">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f28bbc]">你的點唱 · Your request</p><h2 className="mt-4 text-4xl font-black tracking-tight">{customMode ? '自訂歌曲' : selectedSong?.title}</h2><p className="mt-2 text-[#ceb9c5]">{customMode ? 'Custom song request' : selectedSong?.artist}</p></div>
            {!submitted ? (
              <form onSubmit={submitRequest} className="rounded-[1.75rem] bg-white p-5 text-[#2d1b26] shadow-2xl sm:p-7">
                {customMode && <div className="mb-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor="custom-title" className="mb-2 block text-sm font-bold">歌曲名稱 <span className="font-normal text-[#846f7b]">Song title *</span></label><Input id="custom-title" required value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength={100} className="h-12 rounded-xl border-[#e6d7df]" /></div><div><label htmlFor="custom-artist" className="mb-2 block text-sm font-bold">歌手 <span className="font-normal text-[#846f7b]">Artist</span></label><Input id="custom-artist" value={customArtist} onChange={(event) => setCustomArtist(event.target.value)} maxLength={100} className="h-12 rounded-xl border-[#e6d7df]" /></div></div>}
                <div><label htmlFor="nickname" className="mb-2 block text-sm font-bold">你的名字 <span className="font-normal text-[#846f7b]">Nickname *</span></label><Input id="nickname" required value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={30} placeholder="例如 Example: 陳大文 David Chan" className="h-12 rounded-xl border-[#e6d7df]" /></div>
                <div className="mt-5"><div className="mb-2 flex items-end justify-between gap-3"><label htmlFor="message" className="text-sm font-bold">留言 <span className="font-normal text-[#846f7b]">Message (optional)</span></label><span className="text-xs text-[#9a8591]">{message.length}/300</span></div><Textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} rows={4} placeholder="想同表演者講些咩？ / Add a note for the performer" className="min-h-28 resize-none rounded-xl border-[#e6d7df]" /></div>
                {requestError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{requestError}</p>}
                <Button type="submit" disabled={submitting} className="mt-6 h-13 w-full rounded-xl bg-[#d63286] text-base hover:bg-[#bb2873]"><Send /> {submitting ? '送出中…' : '送出點唱'} <span className="font-normal opacity-80">{submitting ? 'Submitting…' : 'Submit request'}</span></Button>
              </form>
            ) : (
              <div id="confirmation" className="rounded-[1.75rem] bg-white p-7 text-[#2d1b26] shadow-2xl sm:p-10">
                <span className="grid size-14 place-items-center rounded-full bg-[#e9f8ef] text-[#21824c]"><CheckCircle2 className="size-7" /></span><h2 className="mt-5 text-3xl font-black">點唱成功！</h2><p className="mt-2 text-[#6e5966]">Your song request has been submitted.</p><p className="mt-5 rounded-xl bg-[#fff1f7] p-4 text-sm leading-relaxed text-[#713355]">多謝支持！表演者會收到你的點唱，並按現場情況安排歌曲。<span className="mt-1 block text-[#90627c]">Thanks! The performer will choose songs based on the live set.</span></p>
                <Button type="button" variant="outline" onClick={() => { setSelectedSong(null); setCustomMode(false); setSubmitted(false); setNickname(''); setMessage(''); setCustomTitle(''); setCustomArtist(''); setRequestError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-6 h-11 rounded-xl border-[#d8bdcc] px-5 text-[#842963]">再點一首 · Request another</Button>
              </div>
            )}
          </div>
        </section>
      )}
      <footer className="relative border-t border-black/5 bg-[#fffaf7] px-5 py-6 text-center text-xs text-[#8a7480]"><p>歡樂滿歌華 · Cantomooncouver</p></footer>
    </main>
  );
}
