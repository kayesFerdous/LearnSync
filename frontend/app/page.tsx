'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AppLogo } from '@/components/app-logo';

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const FEATURES = [
  { num: '01', icon: '🤖', title: 'AI Tutor Chat',          desc: 'Ask anything about your courses. The AI answers with context from your uploaded files, not generic internet knowledge.' },
  { num: '02', icon: '🗺️', title: 'Interactive Mind Maps',  desc: 'Automatically generated knowledge graphs from your materials. Explore concepts visually on an infinite canvas.' },
  { num: '03', icon: '🧠', title: 'Smart Quiz Engine',       desc: 'AI generates targeted quizzes from your notes. Adaptive difficulty. Detailed performance tracking. Real growth.' },
  { num: '04', icon: '📅', title: 'Advanced Calendar',       desc: 'Full-featured calendar with recurring events, drag-and-drop, Google sync, and RFC 5545-compliant scheduling.' },
  { num: '05', icon: '📸', title: 'Routine from Image',      desc: 'Snap a photo of your class timetable. AI extracts and builds your full semester schedule in seconds.' },
  { num: '06', icon: '✍️', title: 'Rich Text Editor',        desc: 'WYSIWYG editor with auto-save. Export to PDF, DOCX, HTML, or plain text. Write essays, notes, reports — all in one place.' },
];

const CAL_DAYS   = ['','','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26'];
const CAL_EVENTS = new Set(['2','7','10','15','22']);

/* ─────────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => el.classList.add('ls-visible'), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, delay]);
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 12px', background: '#f0f4f8', borderRadius: 12 }}>
      {[0, 200, 400].map((d) => (
        <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#999', display: 'block', animation: `lsTyping 1.4s ${d}ms infinite` }} />
      ))}
    </div>
  );
}

function ChatPanel() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2a5c8a', flexShrink: 0 }} />
        <div style={{ background: '#f0f4f8', borderRadius: 12, padding: '8px 12px', fontSize: 13, lineHeight: 1.5, maxWidth: '78%', color: '#333' }}>
          Machine learning is a field of study that gives computers the ability to learn without being explicitly programmed. Your lecture covers supervised, unsupervised, and reinforcement learning.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexDirection: 'row-reverse', marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f0f12', flexShrink: 0 }} />
        <div style={{ background: '#0f0f12', borderRadius: 12, padding: '8px 12px', fontSize: 13, lineHeight: 1.5, color: '#f7f6f2' }}>
          What&apos;s the difference between regression and classification?
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2a5c8a', flexShrink: 0 }} />
        <TypingDots />
      </div>
    </div>
  );
}

function CalendarPanel() {
  return (
    <div style={{ padding: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15 }}>April 2026</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['‹', '›'].map((a) => (
            <button key={a} style={{ width: 24, height: 24, borderRadius: 6, background: '#f0f0f0', border: 'none', cursor: 'pointer', fontSize: 12 }}>{a}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 10 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#bbb', padding: '2px 0' }}>{d}</div>
        ))}
        {CAL_DAYS.map((d, i) => (
          <div key={i} style={{
            aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 8, fontSize: 11, cursor: 'pointer',
            background: d === '20' ? '#0f0f12' : 'transparent',
            color: d === '20' ? '#fff' : CAL_EVENTS.has(d) ? '#2a5c8a' : '#777',
            fontWeight: CAL_EVENTS.has(d) ? 600 : 400,
          }}>{d}</div>
        ))}
      </div>
      {[
        { time: 'Today · 10:00 AM – 11:30 AM', title: 'CSE 411 — Machine Learning Lab',  borderColor: '#2a5c8a', bg: 'rgba(42,92,138,.08)',  timeColor: '#2a5c8a' },
        { time: 'Today · 1:30 PM – 3:00 PM',   title: 'GED 409 — Professional Ethics',   borderColor: '#e8734a', bg: 'rgba(232,115,74,.08)', timeColor: '#e8734a' },
      ].map((ev) => (
        <div key={ev.title} style={{ borderLeft: `3px solid ${ev.borderColor}`, background: ev.bg, borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
          <div style={{ fontSize: 10, color: ev.timeColor, fontFamily: "'DM Mono',monospace" }}>{ev.time}</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{ev.title}</div>
        </div>
      ))}
    </div>
  );
}

function MindMapPanel() {
  const nodes = [
    { label: 'Machine Learning', style: { background: '#0f0f12', color: '#fff', border: 'none', padding: '10px 18px', fontSize: 13, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' } },
    { label: 'Supervised',       style: { top: '12%',  left: '50%', transform: 'translateX(-50%)', color: '#2a5c8a', borderColor: 'rgba(42,92,138,.3)' } },
    { label: 'Neural Networks',  style: { top: '38%',  right: '5%', color: '#e8734a', borderColor: 'rgba(232,115,74,.3)' } },
    { label: 'Reinforcement',    style: { bottom: '12%', left: '50%', transform: 'translateX(-50%)', color: '#3d9e72', borderColor: 'rgba(61,158,114,.3)' } },
    { label: 'Clustering',       style: { top: '38%',  left: '5%',  color: '#7c3aed', borderColor: 'rgba(124,58,237,.3)' } },
  ];
  return (
    <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 400 280">
        <line x1="200" y1="140" x2="200" y2="55"  stroke="#e0e7ef" strokeWidth="1.5" />
        <line x1="200" y1="140" x2="340" y2="140" stroke="#e0e7ef" strokeWidth="1.5" />
        <line x1="200" y1="140" x2="200" y2="225" stroke="#e0e7ef" strokeWidth="1.5" />
        <line x1="200" y1="140" x2="60"  y2="140" stroke="#e0e7ef" strokeWidth="1.5" />
      </svg>
      {nodes.map((n) => (
        <div key={n.label} style={{ position: 'absolute', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '7px 13px', fontSize: 11, fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,.06)', whiteSpace: 'nowrap', ...n.style }}>{n.label}</div>
      ))}
    </div>
  );
}

function FakeDashboard() {
  const smallCalDays = ['','','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26'];
  const evDays = new Set(['2','7','10','22']);
  return (
    <div style={{ background: '#f7f6f2', display: 'grid', gridTemplateColumns: '180px 1fr 220px', minHeight: 440 }}>
      {/* Sidebar */}
      <div style={{ background: '#fff', borderRight: '1px solid #e8e8e8', padding: '1.2rem .8rem' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 13, marginBottom: 14, padding: '0 6px' }}>
          Learn<span style={{ color: '#2a5c8a' }}>Sync</span>
        </div>
        {['Dashboard', 'Chat', 'Courses', 'Calendar', 'Editor', 'Settings'].map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, marginBottom: 3, fontSize: 11, color: i === 0 ? '#2a5c8a' : '#999', background: i === 0 ? '#f0f4f8' : 'transparent', fontWeight: i === 0 ? 500 : 400 }}>
            <div style={{ width: 12, height: 12, background: 'currentColor', opacity: .4, borderRadius: 3, flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>
      {/* Main */}
      <div style={{ padding: '1.2rem' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Good morning, Kayes ✦</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { num: '4',   label: 'Events this week', color: '#2a5c8a' },
            { num: '3',   label: 'Classes today',    color: '#e8734a' },
            { num: '80%', label: 'Last quiz score',  color: '#3d9e72' },
            { num: '11',  label: 'Weekly classes',   color: '#0f0f12' },
          ].map((c) => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #eee' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: c.color }}>{c.num}</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #eee' }}>
          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>April 2026</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 8, color: '#ccc', fontWeight: 600 }}>{d}</div>)}
            {smallCalDays.map((d, i) => (
              <div key={i} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 9, background: d === '20' ? '#0f0f12' : 'transparent', color: d === '20' ? '#fff' : evDays.has(d) ? '#2a5c8a' : '#aaa', fontWeight: evDays.has(d) ? 600 : 400 }}>{d}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Right Panel */}
      <div style={{ background: '#fff', borderLeft: '1px solid #e8e8e8', padding: '1.2rem 1rem' }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Recent Chats</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2a5c8a', flexShrink: 0 }} />
          <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#555', lineHeight: 1.4 }}>What is supervised learning? Let me explain...</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'row-reverse', marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f0f12', flexShrink: 0 }} />
          <div style={{ background: '#0f0f12', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#fff', lineHeight: 1.4 }}>what is machine learning</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2a5c8a', flexShrink: 0 }} />
          <TypingDots />
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>Quizzes</div>
        <div style={{ background: 'rgba(61,158,114,.1)', border: '1px solid rgba(61,158,114,.2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#3d9e72' }}>Machine Learning — Medium</div>
          <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>4 of 5 correct</div>
          <div style={{ height: 5, background: 'rgba(61,158,114,.2)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '80%', background: '#3d9e72', borderRadius: 3 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);

  const previewRef  = useRef<HTMLDivElement>(null);
  const featHeadRef = useRef<HTMLDivElement>(null);
  const featGridRef = useRef<HTMLDivElement>(null);
  const spot1Ref    = useRef<HTMLDivElement>(null);
  const spot2Ref    = useRef<HTMLDivElement>(null);
  const spot3Ref    = useRef<HTMLDivElement>(null);
  const openAppRef  = useRef<HTMLDivElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);

  useReveal(previewRef);
  useReveal(featHeadRef);
  useReveal(spot1Ref);
  useReveal(spot2Ref, 100);
  useReveal(spot3Ref, 200);
  useReveal(openAppRef);
  useReveal(ctaRef);

  // Stagger feature cards
  useEffect(() => {
    const grid = featGridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll<HTMLElement>('.ls-feat-card');
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          cards.forEach((c, i) => setTimeout(() => c.classList.add('ls-visible'), i * 80));
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(grid);
    return () => obs.disconnect();
  }, []);

  // Parallax
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (orb1.current) orb1.current.style.transform = `translateY(${y * 0.15}px)`;
      if (orb2.current) orb2.current.style.transform = `translateY(${y * -0.1}px)`;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const marqueeItems = ['AI-Powered Chat', 'Mind Maps', 'Smart Quizzes', 'Calendar Sync', 'Rich Text Editor', 'Class Routines', 'Google Calendar', 'PDF Support'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        :root { --ink:#0f0f12; --paper:#f7f6f2; --accent:#2a5c8a; --accent2:#e8734a; --muted:#9b97a2; --green:#3d9e72; }

        .ls-page { font-family:'DM Sans',sans-serif; background:var(--paper); color:var(--ink); overflow-x:hidden; }
        .ls-page::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; opacity:.4; }

        .ls-reveal,.ls-feat-card { opacity:0; transform:translateY(28px); transition:opacity .7s ease,transform .7s ease; }
        .ls-visible { opacity:1 !important; transform:none !important; }

        .ls-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:1.1rem 3.5rem; background:rgba(247,246,242,.88); backdrop-filter:blur(14px); border-bottom:1px solid rgba(15,15,18,.07); animation:lsSlideDown .6s ease both; }
        .ls-nav-brand { display:inline-flex; align-items:center; text-decoration:none; }
        .ls-nav-links { display:flex; gap:2.2rem; list-style:none; margin:0; padding:0; }
        .ls-nav-links a { font-size:.875rem; font-weight:500; color:var(--muted); text-decoration:none; transition:color .2s; }
        .ls-nav-links a:hover { color:var(--ink); }
        .ls-nav-cta { background:var(--ink); color:var(--paper); padding:.5rem 1.3rem; border-radius:100px; font-size:.875rem; font-weight:500; text-decoration:none; transition:transform .2s,background .2s; }
        .ls-nav-cta:hover { background:var(--accent); transform:translateY(-1px); }

        .ls-hero { min-height:100vh; display:grid; place-items:center; padding:8rem 4rem 4rem; position:relative; overflow:hidden; }
        .ls-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 80% 20%,rgba(42,92,138,.08) 0%,transparent 60%),radial-gradient(ellipse 50% 60% at 10% 80%,rgba(232,115,74,.07) 0%,transparent 60%); }
        .ls-orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
        .ls-orb1 { width:500px;height:500px;background:rgba(42,92,138,.12);top:-10%;right:-5%;animation:lsFloat1 8s ease-in-out infinite; }
        .ls-orb2 { width:350px;height:350px;background:rgba(232,115,74,.1);bottom:5%;left:-5%;animation:lsFloat2 10s ease-in-out infinite; }
        .ls-orb3 { width:200px;height:200px;background:rgba(61,158,114,.12);top:40%;right:15%;animation:lsFloat3 7s ease-in-out infinite; }

        .ls-badge { display:inline-flex;align-items:center;gap:.5rem;background:rgba(42,92,138,.08);border:1px solid rgba(42,92,138,.18);color:var(--accent);padding:.35rem 1rem;border-radius:100px;font-size:.78rem;font-weight:500;font-family:'DM Mono',monospace;margin-bottom:1.8rem;animation:lsFadeUp .8s .2s both; }
        .ls-badge-dot { width:6px;height:6px;background:var(--accent);border-radius:50%;display:inline-block;animation:lsPulse 2s infinite; }
        .ls-hero-title { font-family:'Playfair Display',serif;font-size:clamp(3.5rem,8vw,7rem);font-weight:900;line-height:.95;letter-spacing:-.04em;margin-bottom:1.4rem;text-align:center;animation:lsFadeUp .8s .35s both; }
        .ls-hero-title em { font-style:italic;color:var(--accent2); }
        .ls-underline { position:relative;display:inline-block; }
        .ls-underline::after { content:'';position:absolute;bottom:4px;left:0;right:0;height:4px;background:var(--accent);border-radius:2px;transform:scaleX(0);transform-origin:left;animation:lsLineReveal 1s 1.2s both; }
        .ls-hero-sub { font-size:1.15rem;line-height:1.6;color:#555;max-width:580px;margin:0 auto 2.8rem;font-weight:300;text-align:center;animation:lsFadeUp .8s .5s both; }
        .ls-hero-actions { display:flex;gap:1rem;justify-content:center;animation:lsFadeUp .8s .65s both; }
        .ls-btn-primary { background:var(--ink);color:var(--paper);padding:.85rem 2.2rem;border-radius:100px;font-size:1rem;font-weight:500;text-decoration:none;display:inline-flex;align-items:center;gap:.5rem;transition:transform .25s,box-shadow .25s;box-shadow:0 4px 20px rgba(15,15,18,.2); }
        .ls-btn-primary:hover { transform:translateY(-3px);box-shadow:0 10px 40px rgba(15,15,18,.25); }
        .ls-btn-secondary { background:transparent;color:var(--ink);padding:.85rem 2.2rem;border-radius:100px;font-size:1rem;font-weight:500;text-decoration:none;border:1.5px solid rgba(15,15,18,.2);transition:border-color .2s,background .2s; }
        .ls-btn-secondary:hover { border-color:var(--ink);background:rgba(15,15,18,.04); }
        .ls-scroll-hint { position:absolute;bottom:3rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.5rem;color:var(--muted);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;animation:lsFadeUp .8s 1s both; }
        .ls-scroll-line { width:1px;height:40px;background:var(--muted);animation:lsScrollLine 2s 1.5s ease-in-out infinite; }

        .ls-screen-frame { background:var(--ink);border-radius:16px;padding:3px;box-shadow:0 40px 120px rgba(15,15,18,.25),0 0 0 1px rgba(15,15,18,.1);overflow:hidden; }
        .ls-screen-bar { background:#1a1a22;padding:.65rem 1rem;display:flex;align-items:center;gap:.5rem; }
        .ls-dot { width:10px;height:10px;border-radius:50%;display:inline-block; }
        .ls-dot-r{background:#ff5f57} .ls-dot-y{background:#febc2e} .ls-dot-g{background:#28c840}
        .ls-url { flex:1;background:#2a2a35;border-radius:6px;margin:0 1rem;padding:.28rem .8rem;font-family:'DM Mono',monospace;font-size:.72rem;color:#666; }

        .ls-marquee { padding:3rem 0;overflow:hidden;border-top:1px solid rgba(15,15,18,.08);border-bottom:1px solid rgba(15,15,18,.08);background:var(--ink); }
        .ls-marquee-track { display:flex;gap:3rem;animation:lsMarquee 20s linear infinite;width:max-content; }
        .ls-marquee-item { font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;color:rgba(247,246,242,.45);white-space:nowrap;display:flex;align-items:center;gap:1.5rem; }
        .ls-marquee-sep { font-style:normal;font-size:.85rem;font-family:'DM Mono',monospace;color:rgba(247,246,242,.18); }

        .ls-label { font-family:'DM Mono',monospace;font-size:.73rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:.9rem; }
        .ls-h2 { font-family:'Playfair Display',serif;font-size:clamp(2.2rem,4vw,3.2rem);font-weight:900;line-height:1.1;letter-spacing:-.03em;margin-bottom:.9rem; }
        .ls-sub { color:#666;font-size:1.05rem;line-height:1.6;max-width:480px; }

        .ls-feat-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:1.5px;background:rgba(15,15,18,.08);border:1.5px solid rgba(15,15,18,.08);border-radius:20px;overflow:hidden; }
        .ls-feat-card { background:#fff;padding:2.5rem;position:relative;overflow:hidden;transition:background .3s,opacity .7s ease,transform .7s ease; }
        .ls-feat-card::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at 0% 0%,rgba(42,92,138,.06) 0%,transparent 60%);opacity:0;transition:opacity .4s; }
        .ls-feat-card:hover { background:#fafafa; }
        .ls-feat-card:hover::before { opacity:1; }

        .ls-spot-row { display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center;margin-bottom:8rem; }
        .ls-spot-row:last-child { margin-bottom:0; }
        .ls-spot-row.ls-reverse { direction:rtl; }
        .ls-spot-row.ls-reverse > * { direction:ltr; }
        .ls-spot-num { font-family:'Playfair Display',serif;font-size:5rem;font-weight:900;color:rgba(15,15,18,.05);line-height:1;margin-bottom:-1rem; }
        .ls-spot-title { font-family:'Playfair Display',serif;font-size:2.1rem;font-weight:900;line-height:1.1;letter-spacing:-.02em;margin-bottom:.9rem; }
        .ls-spot-desc { color:#666;line-height:1.7;margin-bottom:1.4rem; }
        .ls-tags { display:flex;flex-wrap:wrap;gap:.5rem; }
        .ls-tag { padding:.3rem .8rem;border-radius:100px;font-size:.73rem;font-weight:500;font-family:'DM Mono',monospace; }
        .ls-tag-blue   { background:rgba(42,92,138,.1); color:var(--accent); }
        .ls-tag-orange { background:rgba(232,115,74,.1);color:var(--accent2); }
        .ls-tag-green  { background:rgba(61,158,114,.1);color:var(--green); }
        .ls-visual { border-radius:20px;overflow:hidden;box-shadow:0 20px 80px rgba(15,15,18,.12);border:1px solid rgba(15,15,18,.08);background:#fff;transition:transform .4s; }
        .ls-visual:hover { transform:translateY(-8px) rotate(.5deg); }

        .ls-open-shell { border:1.5px solid rgba(15,15,18,.08); border-radius:24px; background:#fff; padding:2rem; box-shadow:0 20px 70px rgba(15,15,18,.08); position:relative; overflow:hidden; }
        .ls-open-shell::before { content:''; position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at 12% 10%, rgba(42,92,138,.08), transparent 48%), radial-gradient(circle at 90% 80%, rgba(232,115,74,.08), transparent 42%); }
        .ls-open-head { position:relative; margin-bottom:1.6rem; }
        .ls-open-title { font-family:'Playfair Display',serif; font-size:clamp(1.9rem,4.2vw,2.8rem); font-weight:900; letter-spacing:-.03em; margin-bottom:.7rem; }
        .ls-open-sub { color:#64616d; max-width:560px; line-height:1.7; }
        .ls-open-grid { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .ls-open-card { border:1px solid rgba(15,15,18,.08); border-radius:16px; background:rgba(247,246,242,.72); padding:1.2rem; backdrop-filter:blur(2px); }
        .ls-open-kicker { font-family:'DM Mono',monospace; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin-bottom:.6rem; }
        .ls-open-card-title { font-family:'Playfair Display',serif; font-size:1.35rem; font-weight:700; margin-bottom:.5rem; }
        .ls-open-copy { font-size:.92rem; color:#5f5b67; line-height:1.6; margin-bottom:1rem; }
        .ls-open-actions { display:flex; gap:.7rem; flex-wrap:wrap; }
        .ls-open-chip { font-family:'DM Mono',monospace; font-size:.7rem; color:#777; border:1px solid rgba(15,15,18,.12); border-radius:100px; padding:.22rem .58rem; background:#fff; }

        @media (max-width: 900px) {
          .ls-open-grid { grid-template-columns:1fr; }
        }

        .ls-testi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:1.5px;background:rgba(247,246,242,.05);border:1.5px solid rgba(247,246,242,.05);border-radius:20px;overflow:hidden; }
        .ls-testi-card { background:rgba(247,246,242,.03);padding:2.5rem;transition:background .3s; }
        .ls-testi-card:hover { background:rgba(247,246,242,.06); }

        .ls-cta-title { font-family:'Playfair Display',serif;font-size:clamp(3rem,6vw,5rem);font-weight:900;line-height:1;letter-spacing:-.04em;margin-bottom:1.4rem; }
        .ls-cta-title em { font-style:italic;color:var(--accent2); }
        .ls-footer-brand { display:inline-flex; align-items:center; }

        @keyframes lsSlideDown   { from{transform:translateY(-100%);opacity:0} to{transform:none;opacity:1} }
        @keyframes lsFadeUp      { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes lsLineReveal  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes lsFloat1      { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,20px) scale(1.05)} }
        @keyframes lsFloat2      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-25px)} }
        @keyframes lsFloat3      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10px,15px)} }
        @keyframes lsScrollLine  { 0%,100%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1)} }
        @keyframes lsPulse       { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes lsMarquee     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes lsTyping      { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
      `}</style>

      <div className="ls-page">

        {/* NAV */}
        <nav className="ls-nav">
          <Link href="/" className="ls-nav-brand" aria-label="LearnSync home">
            <AppLogo
              width={128}
              height={48}
              showWordmark={false}
              priority
              iconClassName="h-12 w-auto"
            />
          </Link>
          <ul className="ls-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#spotlight">How it works</a></li>
            <li><a href="#open-app">Open app</a></li>
          </ul>
          <Link href="/dashboard" className="ls-nav-cta">Get started free →</Link>
        </nav>

        {/* HERO */}
        <section className="ls-hero">
          <div className="ls-hero-bg" />
          <div className="ls-orb ls-orb1" ref={orb1} />
          <div className="ls-orb ls-orb2" ref={orb2} />
          <div className="ls-orb ls-orb3" />
          <div style={{ maxWidth: 900, textAlign: 'center', position: 'relative' }}>
            <div className="ls-badge">
              <span className="ls-badge-dot" />
              Now with AI-powered schedule extraction
            </div>
            <h1 className="ls-hero-title">
              Your <em>learning,</em><br />
              fully <span className="ls-underline">synchronized</span>
            </h1>
            <p className="ls-hero-sub">
              An intelligent workspace that brings your calendar, AI tutor, courses, and documents into one beautiful platform.
            </p>
            <div className="ls-hero-actions">
              <Link href="/dashboard"      className="ls-btn-primary">Start for free →</Link>
              {/* <a    href="#spotlight" className="ls-btn-secondary">See how it works</a> */}
            </div>
          </div>
          <div className="ls-scroll-hint">
            <span>scroll</span>
            <div className="ls-scroll-line" />
          </div>
        </section>

        {/* APP PREVIEW */}
        <section style={{ padding: '2rem 4rem 8rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 1100, width: '100%' }} className="ls-reveal" ref={previewRef}>
            <div className="ls-screen-frame">
              <div className="ls-screen-bar">
                <span className="ls-dot ls-dot-r" />
                <span className="ls-dot ls-dot-y" />
                <span className="ls-dot ls-dot-g" />
                <span className="ls-url">learnsync.app/dashboard</span>
              </div>
              <FakeDashboard />
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="ls-marquee">
          <div className="ls-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="ls-marquee-item">
                {item} <span className="ls-marquee-sep">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section style={{ padding: '6rem 4rem' }} id="features">
          <div className="ls-reveal" ref={featHeadRef} style={{ marginBottom: '4rem' }}>
            <div className="ls-label">Everything you need</div>
            <h2 className="ls-h2">Built for students who mean business.</h2>
            <p className="ls-sub">Six pillars that transform how you learn, organize, and grow.</p>
          </div>
          <div className="ls-feat-grid" ref={featGridRef}>
            {FEATURES.map((f) => (
              <div key={f.num} className="ls-feat-card">
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', color: 'var(--muted)', marginBottom: '1.4rem' }}>{f.num}</div>
                <div style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: '1.4rem', background: 'rgba(42,92,138,.08)', marginBottom: '1.4rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '.5rem' }}>{f.title}</h3>
                <p  style={{ fontSize: '.88rem', color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SPOTLIGHT */}
        <section style={{ padding: '6rem 4rem' }} id="spotlight">
          {/* Row 1 */}
          <div className="ls-spot-row ls-reveal" ref={spot1Ref}>
            <div>
              <div className="ls-spot-num">01</div>
              <div className="ls-label">AI Chat Tutor</div>
              <h3 className="ls-spot-title">Ask your AI tutor anything, anytime.</h3>
              <p className="ls-spot-desc">Upload lecture PDFs, slides, and notes. Your AI tutor reads everything and answers with pinpoint accuracy from your actual course materials — not random web results.</p>
              <div className="ls-tags">
                {['Context-aware', 'Real-time streaming', 'PDF support', 'Multiple threads'].map((t) => <span key={t} className="ls-tag ls-tag-blue">{t}</span>)}
              </div>
            </div>
            <div className="ls-visual"><ChatPanel /></div>
          </div>

          {/* Row 2 */}
          <div className="ls-spot-row ls-reverse ls-reveal" ref={spot2Ref}>
            <div>
              <div className="ls-spot-num">02</div>
              <div className="ls-label">Smart Calendar</div>
              <h3 className="ls-spot-title">Never miss a class or deadline again.</h3>
              <p className="ls-spot-desc">Full calendar with recurring events, drag-and-drop rescheduling, timezone support, and seamless Google Calendar sync. Create your entire semester in one go by uploading a routine image.</p>
              <div className="ls-tags">
                {['Recurring events', 'Google sync', 'Timezone-aware'].map((t) => <span key={t} className="ls-tag ls-tag-orange">{t}</span>)}
              </div>
            </div>
            <div className="ls-visual"><CalendarPanel /></div>
          </div>

          {/* Row 3 */}
          <div className="ls-spot-row ls-reveal" ref={spot3Ref}>
            <div>
              <div className="ls-spot-num">03</div>
              <div className="ls-label">Knowledge Graphs</div>
              <h3 className="ls-spot-title">See how concepts connect.</h3>
              <p className="ls-spot-desc">Automatically generated from your course materials. Explore your knowledge visually on an infinite 2D canvas. Understand relationships you&apos;d never spot in linear notes.</p>
              <div className="ls-tags">
                {['Auto-generated', 'Interactive canvas', 'Course-connected'].map((t) => <span key={t} className="ls-tag ls-tag-green">{t}</span>)}
              </div>
            </div>
            <div className="ls-visual"><MindMapPanel /></div>
          </div>
        </section>

        {/* OPEN APP */}
        <section style={{ padding: '2rem 4rem 6rem' }} id="open-app">
          <div className="ls-reveal" ref={openAppRef}>
            <div className="ls-open-shell">
              <div className="ls-open-head">
                <div className="ls-label">Quick access</div>
                <h2 className="ls-open-title">Open the app and pick up where you left off.</h2>
                <p className="ls-open-sub">Jump straight into your dashboard, chat context, calendar events, and current study flow in one click.</p>
              </div>
              <div className="ls-open-grid">
                <div className="ls-open-card">
                  <div className="ls-open-kicker">Returning learner</div>
                  <h3 className="ls-open-card-title">Open your workspace</h3>
                  <p className="ls-open-copy">Already have an account? Go directly to your app and continue your routine.</p>
                  <div className="ls-open-actions">
                    <Link href="/dashboard" className="ls-btn-primary">Open app →</Link>
                  </div>
                </div>
                <div className="ls-open-card">
                  <div className="ls-open-kicker">New here</div>
                  <h3 className="ls-open-card-title">Create your free account</h3>
                  <p className="ls-open-copy">Start with AI chat, mind maps, quizzes, and calendar planning in minutes.</p>
                  <div className="ls-open-actions">
                    <Link href="/dashboard" className="ls-btn-secondary">Get started</Link>
                    <span className="ls-open-chip">No credit card</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '8rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(42,92,138,.07) 0%,transparent 70%)' }} />
          <div className="ls-reveal" ref={ctaRef} style={{ position: 'relative' }}>
            <div className="ls-label" style={{ display: 'block', marginBottom: '1rem' }}>Ready?</div>
            <h2 className="ls-cta-title">Start learning<br /><em>smarter</em> today.</h2>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: 480, margin: '0 auto 2.8rem', lineHeight: 1.6 }}>
              Join students who have already synchronized their academic life with LearnSync. Free to start, always.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/dashboard"     className="ls-btn-primary"   style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>Create free account →</Link>
              <a    href="#features" className="ls-btn-secondary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>Explore features</a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: 'var(--ink)', color: 'rgba(247,246,242,.4)', padding: '3rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="ls-footer-brand">
            <AppLogo
              width={116}
              height={44}
              showWordmark={false}
              iconClassName="h-11 w-auto"
            />
          </div>
          <p style={{ fontSize: '.8rem' }}>© 2026 LearnSync. Built for curious minds.</p>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '.7rem' }}>v1.0 · Next.js </p>
        </footer>

      </div>
    </>
  );
}