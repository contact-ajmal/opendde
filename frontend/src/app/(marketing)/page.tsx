'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Crosshair, FlaskConical, Box, Beaker, Sparkles, BarChart3, Search, TrendingUp, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Scroll-triggered count-up ───────────────────────────────
function useScrollCountUp(target: number, duration = 1200): [number, React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>;
  const [value, setValue] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered || target === 0) return;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [triggered, target, duration]);

  return [value, ref];
}

// ── Animated background dots ────────────────────────────────
function BackgroundGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-emerald-400" />
      </svg>
    </div>
  );
}

// ── Animated protein silhouette ─────────────────────────────
function ProteinVisual() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Simulated platform UI */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-amber-500/60" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 text-center text-xs text-muted">OpenDDE — EGFR (P00533)</div>
        </div>
        <div className="relative flex h-[320px] sm:h-[380px]">
          {/* Protein visualization area */}
          <div className="flex-1 relative bg-[#0f172a] flex items-center justify-center">
            <svg viewBox="0 0 400 300" className="w-full h-full p-8" xmlns="http://www.w3.org/2000/svg">
              {/* Protein backbone - stylized helix */}
              <path
                d="M80,150 Q120,80 160,130 Q200,180 240,110 Q280,40 320,120"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.4"
              >
                <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
                  M80,150 Q120,80 160,130 Q200,180 240,110 Q280,40 320,120;
                  M80,140 Q120,90 160,140 Q200,170 240,120 Q280,50 320,130;
                  M80,150 Q120,80 160,130 Q200,180 240,110 Q280,40 320,120
                " />
              </path>
              <path
                d="M90,170 Q130,100 170,150 Q210,200 250,130 Q290,60 330,140"
                fill="none"
                stroke="#6366f1"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.3"
              >
                <animate attributeName="d" dur="10s" repeatCount="indefinite" values="
                  M90,170 Q130,100 170,150 Q210,200 250,130 Q290,60 330,140;
                  M90,160 Q130,110 170,160 Q210,190 250,140 Q290,70 330,150;
                  M90,170 Q130,100 170,150 Q210,200 250,130 Q290,60 330,140
                " />
              </path>
              {/* Pocket 1 - pulsing */}
              <circle cx="160" cy="135" r="28" fill="#10b981" opacity="0.15">
                <animate attributeName="r" dur="3s" repeatCount="indefinite" values="26;32;26" />
                <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.1;0.25;0.1" />
              </circle>
              <circle cx="160" cy="135" r="4" fill="#10b981" opacity="0.8" />
              <text x="160" y="175" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="600" opacity="0.8">Pocket 1</text>
              {/* Pocket 2 */}
              <circle cx="280" cy="105" r="22" fill="#3b82f6" opacity="0.15">
                <animate attributeName="r" dur="4s" repeatCount="indefinite" values="20;26;20" />
                <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0.1;0.2;0.1" />
              </circle>
              <circle cx="280" cy="105" r="3" fill="#3b82f6" opacity="0.8" />
              <text x="280" y="140" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="600" opacity="0.8">Pocket 2</text>
              {/* Residue dots */}
              {[
                [145, 120], [155, 145], [170, 125], [175, 150], [148, 140],
                [270, 95], [290, 110], [275, 115], [285, 95],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2" fill={i < 5 ? '#10b981' : '#3b82f6'} opacity="0.5" />
              ))}
            </svg>
          </div>
          {/* Sidebar panel */}
          <div className="hidden sm:flex w-48 flex-col border-l border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="mb-3 text-xs font-semibold text-foreground">Pockets</div>
            <div className="space-y-2">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-emerald-400">Pocket 1</span>
                  <span className="text-emerald-400">87%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[var(--surface-alt)]">
                  <div className="h-full w-[87%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="rounded-lg bg-[var(--surface-alt)] p-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-blue-400">Pocket 2</span>
                  <span className="text-blue-400">62%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[var(--surface-alt)]">
                  <div className="h-full w-[62%] rounded-full bg-blue-500" />
                </div>
              </div>
              <div className="rounded-lg bg-[var(--surface-alt)] p-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted">Pocket 3</span>
                  <span className="text-muted">34%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[var(--surface-alt)]">
                  <div className="h-full w-[34%] rounded-full bg-amber-500" />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-foreground">Ligands</div>
            <div className="mt-1 text-xs text-muted">50 compounds</div>
            <div className="mt-1 text-xs text-emerald-400">4 approved drugs</div>
          </div>
        </div>
      </div>
      {/* Glow effect behind the mockup */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-emerald-500/5 blur-2xl" />
    </div>
  );
}

// ── Feature cards ───────────────────────────────────────────
const features = [
  { icon: Crosshair, title: 'Pocket Discovery', description: 'Machine-learning binding site prediction with P2Rank. Identifies druggable pockets with residue-level detail.' },
  { icon: FlaskConical, title: 'Ligand Intelligence', description: 'Fetch known drugs from ChEMBL with IC50, Ki activity data, clinical phase, and structure-activity relationships.' },
  { icon: Box, title: 'Complex Prediction', description: 'Generate AlphaFold 3 input for protein-ligand binding. Semi-automated prediction workflow.' },
  { icon: Beaker, title: 'Antibody Modeling', description: 'Predict antibody 3D structures from VH/VL sequences using ABodyBuilder2 with CDR visualization.' },
  { icon: Sparkles, title: 'AI Assistant', description: 'Claude-powered drug design insights. Context-aware analysis of targets, pockets, and ligands.' },
  { icon: BarChart3, title: 'Analytics & Reports', description: 'Druggability reports, SAR plots, activity cliffs, pocket comparison, and PDF export.' },
];

// ── Trust logos ──────────────────────────────────────────────
const trustItems = [
  'AlphaFold 3', 'P2Rank', 'ChEMBL', 'ImmuneBuilder', 'RDKit', 'OpenTargets',
];

// ── Section 4: Visual walkthrough (tabbed showcase) ─────────
const walkthroughTabs = [
  {
    id: 'pockets',
    label: 'Pocket discovery',
    title: 'Pocket discovery',
    description: 'Enter any protein target and instantly see predicted binding pockets ranked by druggability. P2Rank\u2019s ML algorithm identifies sites that traditional methods might miss \u2014 including allosteric and cryptic pockets.',
    checks: ['Druggability scoring', '3D visualization', 'Residue mapping'],
    href: '/app/dashboard',
    cta: 'Try it now',
    gradient: 'from-emerald-900/40 to-emerald-950/60',
    accent: '#10b981',
    mockupLabel: 'EGFR (P00533) \u2014 3 druggable pockets detected',
  },
  {
    id: 'ligands',
    label: 'Ligand intelligence',
    title: 'Ligand intelligence',
    description: 'Explore known drugs and bioactive compounds for any target. IC50, Ki, and Kd activity data, clinical trial phases, structure-activity relationships, and druglikeness scoring \u2014 all in one view.',
    checks: ['ChEMBL integration', 'SAR analysis', 'Activity cliffs'],
    href: '/app/dashboard',
    cta: 'Try it now',
    gradient: 'from-blue-900/40 to-blue-950/60',
    accent: '#3b82f6',
    mockupLabel: '50 known compounds \u2014 4 approved drugs for EGFR',
  },
  {
    id: 'prediction',
    label: 'Complex prediction',
    title: 'Complex prediction',
    description: 'Generate AlphaFold 3-compatible input for protein-ligand binding predictions. Semi-automated workflow: prepare input, submit to AF3 Server, upload results, and visualize the predicted complex in 3D.',
    checks: ['AF3 input generation', 'Confidence metrics', '3D comparison'],
    href: '/app/dashboard',
    cta: 'Try it now',
    gradient: 'from-purple-900/40 to-purple-950/60',
    accent: '#a78bfa',
    mockupLabel: 'Erlotinib\u2013EGFR complex \u2014 ipTM 0.87, pLDDT 82.3',
  },
  {
    id: 'antibody',
    label: 'Antibody modeling',
    title: 'Antibody modeling',
    description: 'Predict antibody 3D structures from VH/VL sequences using ABodyBuilder2. Identifies and visualizes all six CDR loops with Chothia numbering \u2014 essential for therapeutic antibody engineering.',
    checks: ['CDR identification', '3D structure', 'Sequence input'],
    href: '/app/antibody',
    cta: 'Try it now',
    gradient: 'from-amber-900/40 to-amber-950/60',
    accent: '#f59e0b',
    mockupLabel: 'Trastuzumab \u2014 6 CDR loops identified',
  },
];

function VisualWalkthrough() {
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance every 5s
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveTab((i) => (i + 1) % walkthroughTabs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const tab = walkthroughTabs[activeTab];

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Platform</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">See OpenDDE in action</h2>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {walkthroughTabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(i); setPaused(true); }}
              className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors ${
                i === activeTab
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--surface-alt)] text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Browser-chrome screenshot frame */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 text-center text-[11px] font-mono text-muted">
                  opendde.org{tab.id === 'pockets' ? '/app/target/P00533' : tab.id === 'ligands' ? '/app/target/P00533/pocket/1' : tab.id === 'prediction' ? '/app/target/P00533/compare' : '/app/antibody'}
                </div>
                <span className="text-[10px] font-medium text-emerald-400">{tab.mockupLabel}</span>
              </div>
              <div className="relative aspect-[16/10] bg-[var(--bg)]">
                <Image
                  src={`/screenshots/${tab.id}.png`}
                  alt={tab.title}
                  fill
                  priority={activeTab === 0}
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-cover object-top"
                />
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                  <motion.div
                    key={`progress-${activeTab}-${paused}`}
                    className="h-full"
                    style={{ backgroundColor: tab.accent }}
                    initial={{ width: '0%' }}
                    animate={{ width: paused ? undefined : '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>

            {/* Description below */}
            <div className="mt-8 mx-auto max-w-2xl text-center">
              <h3 className="text-2xl font-bold text-foreground">{tab.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{tab.description}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {tab.checks.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 text-sm text-foreground">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8l3 3 5-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {c}
                  </span>
                ))}
              </div>
              <Link
                href={tab.href}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {tab.cta}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Section 5: Interactive slideshow demo ───────────────────
const demoSteps = [
  {
    id: 'dashboard',
    title: '1. Search a protein target',
    caption: 'Start from the dashboard and jump to any UniProt ID — EGFR, BRAF, ACE2, or your own.',
    src: '/screenshots/dashboard.png',
    url: '/app/dashboard',
  },
  {
    id: 'pockets',
    title: '2. Discover druggable pockets',
    caption: 'P2Rank ranks binding sites by druggability and maps residues in a live 3D viewer.',
    src: '/screenshots/pockets.png',
    url: '/app/target/P00533',
  },
  {
    id: 'ligands',
    title: '3. Explore known ligands',
    caption: 'Browse ChEMBL-linked compounds with IC50, clinical phase, and Lipinski druglikeness.',
    src: '/screenshots/ligands.png',
    url: '/app/target/P00533/pocket/1',
  },
  {
    id: 'prediction',
    title: '4. Compare predictions',
    caption: 'Side-by-side evaluation of AlphaFold 3 complex predictions for each candidate.',
    src: '/screenshots/prediction.png',
    url: '/app/target/P00533/compare',
  },
  {
    id: 'antibody',
    title: '5. Model antibodies',
    caption: 'Predict VH/VL structures and CDR loops from sequence via ImmuneBuilder.',
    src: '/screenshots/antibody.png',
    url: '/app/antibody',
  },
  {
    id: 'analytics',
    title: '6. Platform analytics',
    caption: 'Druggability distribution, clinical phases, and exploration timeline at a glance.',
    src: '/screenshots/analytics.png',
    url: '/app/analytics',
  },
];

const DEMO_INTERVAL_MS = 3500;

function VideoSection() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Auto-advance
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % demoSteps.length);
    }, DEMO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const step = demoSteps[index];

  function goto(i: number) {
    setIndex(((i % demoSteps.length) + demoSteps.length) % demoSteps.length);
  }

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Demo
          </p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            See it end to end
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            A guided walkthrough of the full OpenDDE pipeline — from target search to druggable
            insights — using real screenshots from the running app.
          </p>
        </div>

        {/* Slideshow frame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl shadow-black/40"
        >
          {/* Chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-amber-500/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 text-center text-[11px] font-mono text-muted">
              opendde.org{step.url}
            </div>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex h-6 items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[10px] font-medium text-muted hover:text-foreground transition-colors"
              aria-label={playing ? 'Pause demo' : 'Play demo'}
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>

          {/* Slide */}
          <div className="relative aspect-[16/10] bg-[var(--bg)]">
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Image
                src={step.src}
                alt={step.title}
                fill
                sizes="(max-width: 768px) 100vw, 1100px"
                className="object-cover object-top"
                priority={index === 0}
              />
            </motion.div>

            {/* Prev / Next arrows */}
            <button
              onClick={() => { setPlaying(false); goto(index - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100"
              aria-label="Previous slide"
              style={{ opacity: 1 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setPlaying(false); goto(index + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-opacity hover:bg-black/80"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Caption overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 py-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">{step.title}</div>
                  <div className="mt-0.5 text-xs text-white/70">{step.caption}</div>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] font-mono text-white/80 backdrop-blur">
                  {index + 1} / {demoSteps.length}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <motion.div
                key={`progress-${index}-${playing}`}
                className="h-full bg-emerald-500"
                initial={{ width: '0%' }}
                animate={{ width: playing ? '100%' : undefined }}
                transition={{ duration: DEMO_INTERVAL_MS / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Step pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {demoSteps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setPlaying(false); goto(i); }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                i === index
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--surface-alt)] text-muted hover:text-foreground'
              }`}
            >
              {s.title.replace(/^\d+\.\s*/, '')}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            Try it yourself
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Section 6: Use cases ────────────────────────────────────
const useCases = [
  {
    icon: '🔬',
    persona: 'Academic researchers',
    description: 'Explore new drug targets for your research. Identify druggable pockets, find known compounds, and generate publication-ready druggability reports \u2014 all without commercial software licenses.',
    cta: 'Explore targets',
    href: '/app/dashboard',
  },
  {
    icon: '💊',
    persona: 'Pharma scientists',
    description: 'Rapidly screen targets and validate druggability before committing lab resources. Compare pockets, analyze structure-activity relationships, and prioritize compounds computationally.',
    cta: 'Start screening',
    href: '/app/dashboard',
  },
  {
    icon: '🎓',
    persona: 'Students',
    description: 'Learn drug design concepts hands-on. Understand how binding pockets, ligand activity, and molecular predictions work in practice with real protein targets and compounds.',
    cta: 'Start learning',
    href: '/app/dashboard',
  },
  {
    icon: '🧬',
    persona: 'Biotech startups',
    description: 'Professional-grade target assessment without expensive commercial software. Generate investor-ready druggability reports with pocket analysis, ligand landscape, and AI-powered insights.',
    cta: 'Assess targets',
    href: '/app/dashboard',
  },
];

function UseCases() {
  return (
    <section id="use-cases" className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Use Cases</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Who is OpenDDE for?</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.persona}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="mb-3 text-3xl">{uc.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{uc.persona}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted">{uc.description}</p>
              <Link
                href={uc.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {uc.cta}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main page ───────────────────────────────────────────────
export default function HomePage() {
  const [stat1, ref1] = useScrollCountUp(200);
  const [stat2, ref2] = useScrollCountUp(4);
  const [stat3, ref3] = useScrollCountUp(50);

  return (
    <main className="min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <BackgroundGrid />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Open source &middot; MIT Licensed
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Open-source AI-powered
              <br />
              <span className="text-[var(--accent)]">drug design platform</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              From protein target to druggable pocket to molecular prediction — in minutes, not months.
              Built on AlphaFold 3, P2Rank, and the latest open-source computational biology tools.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/app/dashboard"
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.97] transition-all"
              >
                Launch platform
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 text-base font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <ProteinVisual />
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="mb-4 text-xs uppercase tracking-widest text-muted-2">
              Built with leading open-source tools
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {trustItems.map((name) => (
                <span key={name} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-muted">
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          <div ref={ref1} className="text-center">
            <div className="text-3xl font-bold text-foreground sm:text-4xl">{stat1}M+</div>
            <div className="mt-1 text-sm text-muted">Protein structures<br />in AlphaFold DB</div>
          </div>
          <div ref={ref2} className="text-center">
            <div className="text-3xl font-bold text-foreground sm:text-4xl">{stat2}</div>
            <div className="mt-1 text-sm text-muted">AI-powered<br />prediction engines</div>
          </div>
          <div ref={ref3} className="text-center">
            <div className="text-3xl font-bold text-foreground sm:text-4xl">{stat3}+</div>
            <div className="mt-1 text-sm text-muted">Known drug<br />databases integrated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground sm:text-4xl">100%</div>
            <div className="mt-1 text-sm text-muted">Open source<br />MIT license</div>
          </div>
        </div>
      </section>

      {/* ── Section 1: The Drug Discovery Challenge ────────── */}
      <section id="learn-drug-discovery" className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">The Challenge</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Developing a new drug takes <span className="text-[var(--accent)]">10&ndash;15 years</span> and costs <span className="text-[var(--accent)]">$2.6 billion</span>
            </h2>
          </motion.div>

          {/* Timeline visualization */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-12"
          >
            <div className="relative overflow-x-auto pb-4">
              <div className="mx-auto flex min-w-[700px] max-w-4xl gap-1">
                {[
                  { label: 'Target ID', duration: '2-3 yrs', color: 'bg-emerald-500', textColor: 'text-emerald-100', flex: 2.5, opendde: true },
                  { label: 'Hit Finding', duration: '1-2 yrs', color: 'bg-emerald-500', textColor: 'text-emerald-100', flex: 1.5, opendde: true },
                  { label: 'Lead Optimization', duration: '1-2 yrs', color: 'bg-emerald-500/70', textColor: 'text-emerald-100', flex: 1.5, opendde: true },
                  { label: 'Preclinical', duration: '1 yr', color: 'bg-slate-600', textColor: 'text-slate-200', flex: 1, opendde: false },
                  { label: 'Phase I', duration: '1-2 yrs', color: 'bg-blue-600/70', textColor: 'text-blue-100', flex: 1.5, opendde: false },
                  { label: 'Phase II', duration: '2-3 yrs', color: 'bg-blue-600', textColor: 'text-blue-100', flex: 2.5, opendde: false },
                  { label: 'Phase III', duration: '3-4 yrs', color: 'bg-blue-700', textColor: 'text-blue-100', flex: 3.5, opendde: false },
                  { label: 'Approval', duration: '1-2 yrs', color: 'bg-slate-700', textColor: 'text-slate-200', flex: 1.5, opendde: false },
                ].map((phase, i) => (
                  <div key={phase.label} style={{ flex: phase.flex }} className="min-w-0">
                    <div className={`rounded-md ${phase.color} px-2 py-3 ${phase.opendde ? 'ring-2 ring-emerald-400/40' : ''}`}>
                      <div className={`truncate text-xs font-semibold ${phase.textColor}`}>{phase.label}</div>
                      <div className={`text-[10px] ${phase.textColor} opacity-70`}>{phase.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* OpenDDE bracket */}
              <div className="mx-auto max-w-4xl mt-2 min-w-[700px]">
                <div className="flex">
                  <div style={{ flex: 5.5 }} className="border-b-2 border-l-2 border-r-2 border-emerald-400/50 rounded-b-lg h-4 relative">
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-emerald-400">
                      OpenDDE accelerates these stages
                    </div>
                  </div>
                  <div style={{ flex: 10 }} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-16 mx-auto max-w-2xl text-center"
          >
            <p className="text-lg text-muted leading-relaxed">
              Only <span className="font-semibold text-foreground">12% of drugs</span> that enter clinical trials are eventually approved.
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              OpenDDE accelerates the earliest stages &mdash; target validation, pocket discovery, and hit identification &mdash; where computational tools can save years of experimental work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: How Drug Discovery Works ──────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Drug Discovery 101</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How drug discovery works</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Understanding the journey from disease biology to approved medicine.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border)] sm:left-1/2 sm:-translate-x-px" />

            {[
              {
                step: 1,
                title: 'Identify the target',
                description: 'Every disease is caused by specific proteins malfunctioning in the body. The first step is identifying which protein to target \u2014 like finding which broken part of an engine to fix.',
                icon: Crosshair,
                badge: null,
                side: 'right' as const,
              },
              {
                step: 2,
                title: 'Find the binding pocket',
                description: 'Proteins have specific pockets on their surface where small molecules can bind, like a key fitting into a lock. Finding these pockets is critical \u2014 you need to know WHERE on the protein a drug can attach.',
                icon: Search,
                badge: 'OpenDDE: P2Rank pocket prediction',
                side: 'left' as const,
              },
              {
                step: 3,
                title: 'Discover candidate molecules',
                description: 'Researchers search databases of known compounds to find molecules that might fit the pocket. They look at what\u2019s already been tested, analyze structure-activity relationships, and identify promising starting points.',
                icon: FlaskConical,
                badge: 'OpenDDE: ChEMBL ligand intelligence',
                side: 'right' as const,
              },
              {
                step: 4,
                title: 'Predict how drugs bind',
                description: 'Before testing in a lab, computational tools predict how a drug molecule will sit inside the pocket \u2014 its orientation, molecular contacts, and binding stability.',
                icon: Box,
                badge: 'OpenDDE: AlphaFold 3 complex prediction',
                side: 'left' as const,
              },
              {
                step: 5,
                title: 'Optimize and test',
                description: 'The best candidates are refined \u2014 modified to bind more tightly, be more selective, and have fewer side effects. Then they enter lab testing and eventually clinical trials.',
                icon: TrendingUp,
                badge: 'OpenDDE: AI suggestions + druglikeness scoring',
                side: 'right' as const,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: item.side === 'right' ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative mb-12 last:mb-0 pl-16 sm:pl-0 ${
                  item.side === 'right'
                    ? 'sm:pr-[calc(50%+2rem)] sm:text-right'
                    : 'sm:pl-[calc(50%+2rem)]'
                }`}
              >
                {/* Step number on the line */}
                <div className={`absolute top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                  item.badge
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-[var(--border)] bg-[var(--surface-alt)] text-muted'
                } text-lg font-bold left-0 sm:left-1/2 sm:-translate-x-1/2`}>
                  {item.step}
                </div>

                {/* Card */}
                <div className={`rounded-xl border p-5 transition-colors ${
                  item.badge
                    ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-hover)]'
                }`}>
                  <div className={`mb-3 flex items-center gap-3 ${item.side === 'right' ? 'sm:flex-row-reverse' : ''}`}>
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      item.badge ? 'bg-emerald-500/15' : 'bg-[var(--surface-alt)]'
                    }`}>
                      <item.icon className={`h-4.5 w-4.5 ${item.badge ? 'text-emerald-400' : 'text-muted'}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                  {item.badge && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 ${
                      item.side === 'right' ? 'sm:float-right' : ''
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {item.badge}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Why Computational Drug Design ─────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">The Impact</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Why computational drug design?</h2>
          </div>

          {/* Value cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-16">
            {[
              {
                number: '1000x',
                label: 'faster',
                description: 'AI predicts binding in seconds vs weeks of wet-lab experiments',
              },
              {
                number: 'Weeks',
                label: 'not years',
                description: 'Virtual screening replaces months of manual compound testing',
              },
              {
                number: 'Novel',
                label: 'targets',
                description: 'Discover pockets on previously "undruggable" proteins',
              },
            ].map((card, i) => (
              <motion.div
                key={card.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center"
              >
                <div className="text-3xl font-bold text-[var(--accent)] sm:text-4xl">{card.number}</div>
                <div className="text-sm font-medium text-foreground">{card.label}</div>
                <p className="mt-3 text-sm text-muted leading-relaxed">{card.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl"
          >
            <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-lg italic leading-relaxed text-foreground">
                &ldquo;[IsoDDE] more than doubles the accuracy of the best existing method, AlphaFold 3, in predicting binding poses for drug-like molecules.&rdquo;
              </p>
              <footer className="mt-4 text-sm text-muted">
                &mdash; Isomorphic Labs, February 2025
              </footer>
            </blockquote>

            <p className="mt-8 text-center text-muted leading-relaxed">
              OpenDDE brings these capabilities to every researcher, for free, using open-source tools.
              No cloud GPU required. No vendor lock-in. Just science.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Section 4: Visual Walkthrough ────────────────────── */}
      <VisualWalkthrough />

      {/* ── Section 5: Video Demo ────────────────────────────── */}
      <VideoSection />

      {/* ── Section 6: Use Cases ─────────────────────────────── */}
      <UseCases />

      {/* ── Section 7: Tech Stack ────────────────────────────── */}
      <section className="border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400"
            >
              Built on giants
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              Powered by the best open-source tools
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-muted"
            >
              OpenDDE integrates world-class computational biology tools into a single, cohesive platform.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { name: 'AlphaFold 3', provides: 'Structure prediction', org: 'Google DeepMind', href: 'https://alphafold.ebi.ac.uk/' },
              { name: 'P2Rank', provides: 'Pocket detection', org: 'Czech Technical University', href: 'https://github.com/rdk/p2rank' },
              { name: 'ChEMBL', provides: 'Bioactivity data', org: 'EMBL-EBI', href: 'https://www.ebi.ac.uk/chembl/' },
              { name: 'RDKit', provides: 'Cheminformatics', org: 'Open-source community', href: 'https://www.rdkit.org/' },
              { name: 'ImmuneBuilder', provides: 'Antibody modeling', org: 'Oxford Protein Informatics', href: 'https://github.com/oxpig/ImmuneBuilder' },
              { name: 'UniProt', provides: 'Protein knowledge base', org: 'UniProt Consortium', href: 'https://www.uniprot.org/' },
              { name: 'PubChem', provides: 'Chemical data', org: 'NCBI / NIH', href: 'https://pubchem.ncbi.nlm.nih.gov/' },
              { name: 'Claude AI', provides: 'Scientific reasoning', org: 'Anthropic', href: 'https://www.anthropic.com/' },
            ].map((tool, i) => (
              <motion.a
                key={tool.name}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-hover)] hover:-translate-y-1 transition-all"
              >
                <h3 className="text-base font-semibold text-foreground group-hover:text-emerald-400 transition-colors">{tool.name}</h3>
                <p className="mt-1 text-sm text-muted">{tool.provides}</p>
                <p className="mt-2 text-xs text-muted-2">{tool.org}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Open Source Mission ────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400"
            >
              Our mission
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              Open source and free forever
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-muted"
            >
              We believe computational drug design should be accessible to every researcher,
              not locked behind expensive licenses or proprietary platforms.
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'MIT Licensed',
                description: 'Use, modify, and distribute freely. No strings attached, no usage limits, no hidden fees.',
                icon: '📜',
              },
              {
                title: 'Docker Ready',
                description: 'One command to run everything. Six containers, fully orchestrated, with health checks and auto-restart.',
                icon: '🐳',
              },
              {
                title: 'Community Driven',
                description: 'Built in the open. Every feature request, bug report, and pull request makes the platform better for everyone.',
                icon: '🤝',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center"
              >
                <div className="mb-3 text-3xl">{card.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Star on GitHub
            </a>
            <Link
              href="/app/dashboard"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Read the docs
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Contribute
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 9: IsoDDE Attribution ─────────────────────── */}
      <section className="border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400"
          >
            Standing on shoulders
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-foreground sm:text-4xl"
          >
            Inspired by the frontier
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
          >
            <p className="text-muted leading-relaxed">
              OpenDDE draws deep inspiration from{' '}
              <a
                href="https://www.isomorphiclabs.com/articles/isodde-a-new-era-for-drug-design"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors"
              >
                Isomorphic Labs&apos; IsoDDE
              </a>
              , which demonstrated that AI-first drug design can more than double the accuracy of existing
              methods in predicting binding poses. While IsoDDE remains a proprietary, frontier system,
              OpenDDE aims to bring similar workflows to the open-source community by composing the best
              freely available tools into a cohesive, Docker-native platform.
            </p>
            <p className="mt-4 text-sm text-muted-2">
              OpenDDE is an independent, community-built project and is not affiliated with Isomorphic Labs or Google DeepMind.
              Its modular architecture allows each component to be swapped as better open-source alternatives emerge.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Everything you need for drug design</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              From target identification to lead optimization, OpenDDE provides a complete computational drug design workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ready to explore?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Search any protein target and discover its druggable pockets, known compounds, and binding predictions in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/app/dashboard"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.97] transition-all"
            >
              Get started for free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Professional Footer ────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-4 pt-16 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-400">OpenDDE</span>
              </div>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Open-source computational drug design engine. From target to lead, in one platform.
              </p>
            </div>

            {/* Platform column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Platform</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li><Link href="/app/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/app/target/P00533" className="hover:text-foreground transition-colors">Target Explorer</Link></li>
                <li><Link href="/app/antibody" className="hover:text-foreground transition-colors">Antibody Prediction</Link></li>
                <li><Link href="/app/analytics" className="hover:text-foreground transition-colors">Analytics</Link></li>
              </ul>
            </div>

            {/* Learn column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Learn</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li><a href="#drug-discovery" className="hover:text-foreground transition-colors">What is Drug Discovery?</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#walkthrough" className="hover:text-foreground transition-colors">Platform Walkthrough</a></li>
              </ul>
            </div>

            {/* Resources column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Resources</h4>
              <ul className="space-y-2.5 text-sm text-muted">
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="https://www.isomorphiclabs.com/articles/isodde-a-new-era-for-drug-design" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    IsoDDE Paper
                  </a>
                </li>
                <li>
                  <a href="https://alphafold.ebi.ac.uk/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    AlphaFold Database
                  </a>
                </li>
                <li>
                  <a href="https://www.ebi.ac.uk/chembl/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    ChEMBL Database
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-2">
              Built with ❤️ by Ajmal &middot; &copy; 2026 OpenDDE &mdash; MIT License
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
