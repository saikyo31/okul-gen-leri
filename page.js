'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  const [candidates, setCandidates] = useState([]), [announcements, setAnnouncements] = useState([]), [results, setResults] = useState([]);
  const [code, setCode] = useState(''), [choice, setChoice] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch('/api/results', { cache: 'no-store' }); const j = await r.json();
    setCandidates(j.candidates || []); setAnnouncements(j.announcements || []); setResults(j.results || []);
  }
  useEffect(() => { load(); }, []);
  async function vote(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/vote', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code: code.trim(), candidateId: choice }) });
      const j = await r.json(); setMessage(j.message || j.error || 'İşlem tamamlanamadı.');
      if (r.ok) { setCode(''); setChoice(''); await load(); }
    } catch { setMessage('Bağlantı kurulamadı. Tekrar deneyin.'); }
    finally { setBusy(false); }
  }
  return <main className="wrap">
    <header className="top"><div className="brand"><span className="dot"/> OKUL <b>GENÇLERİ</b></div><a href="/admin" className="adminLink">Yönetici girişi</a></header>
    <section className="hero"><p className="eyebrow">ÖĞRENCİ SEÇİM PLATFORMU</p><h1>Sesin, <em>geleceğin.</em></h1><p>Tercihini yap, okulunun geleceğinde söz sahibi ol.</p></section>
    <section className="panel"><div className="sectionHead"><div><span className="eyebrow">01 / ADAYLAR</span><h2>Adayları tanı</h2></div><span className="live">● CANLI</span></div>
      <div className="candidateGrid">{candidates.map((c,i)=><article className="candidate" key={c.id}><div className="avatar">{c.photo_url ? <img src={c.photo_url} alt=""/> : <span>{(c.name||'?').slice(0,1).toUpperCase()}</span>}</div><div className="candidateInfo"><small>ADAY {String(i+1).padStart(2,'0')}</small><h3>{c.name}</h3><p>{c.slogan || 'Henüz açıklama eklenmedi.'}</p></div></article>)}</div>
    </section>
    <section className="panel votePanel"><div className="sectionHead"><div><span className="eyebrow">02 / OY KULLAN</span><h2>Tercihini bildir</h2></div></div><p className="muted">Sana verilen, bu saat için geçerli kişisel kodu kullan. Her öğrenci her saat bir kez oy kullanabilir.</p>
      <form onSubmit={vote}><label>Öğrenci kodun<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Örn. 8F2K-..." required autoComplete="off"/></label><label>Aday seç<select value={choice} onChange={e=>setChoice(e.target.value)} required><option value="">Bir aday seç</option>{candidates.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><button disabled={busy || !candidates.length}>{busy?'Gönderiliyor...':'OYUMU GÖNDER'}</button>{message && <p className="message" role="status">{message}</p>}</form>
    </section>
    <section className="panel"><div className="sectionHead"><div><span className="eyebrow">03 / SONUÇLAR</span><h2>Toplam oylar</h2></div><button className="refresh" onClick={load}>Yenile ↻</button></div><p className="muted">Her saat kullanılan oylar toplam sayıya eklenir.</p>{results.length ? <div className="results">{results.map((r,i)=><div className="result" key={r.id}><div className="resultLine"><b>{r.name}</b><strong>{r.vote_count} oy</strong></div><div className="bar"><i style={{width:`${r.percent}%`}}/></div></div>)}</div> : <p className="muted">Henüz oy kullanılmadı.</p>}</section>
    <section className="panel"><span className="eyebrow">04 / DUYURULAR</span><h2>Okuldan haberler</h2>{announcements.length ? announcements.map(a=><article className="news" key={a.id}><small>{new Date(a.created_at).toLocaleString('tr-TR')}</small><h3>{a.title}</h3><p>{a.body}</p></article>) : <p className="muted">Henüz duyuru yok.</p>}</section>
    <footer>OKUL GENÇLERİ <span>•</span> Öğrenci katılım platformu</footer>
  </main>;
}
