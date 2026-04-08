'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crosshair, FlaskConical, Box, Beaker, Sparkles, BarChart3 } from 'lucide-react';

// ── Scroll-triggered count-up ───────────────────────────────
function useScrollCountUp(target: number, duration = 1200): [number, React.RefObject<HTMLDivElement | null>] {
  const ref = useRef<HTMLDivElement>(null);
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

      {/* ── Features Grid ────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-20">
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

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How it works</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Search for a target', description: 'Enter a UniProt ID, PDB code, or gene name. OpenDDE resolves the protein and fetches its 3D structure from AlphaFold DB.' },
              { step: '2', title: 'Discover druggable pockets', description: 'P2Rank analyzes the protein structure using machine learning to identify binding sites. Each pocket gets a druggability score and residue-level detail.' },
              { step: '3', title: 'Explore known compounds', description: 'ChEMBL data reveals known drugs and bioactive molecules with IC50 activity data, clinical trial status, and structure-activity relationships.' },
              { step: '4', title: 'Predict and optimize', description: 'Generate AlphaFold 3 predictions for protein-ligand complexes. Use the AI assistant for drug design insights and ligand modification suggestions.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-muted leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.97] transition-all"
            >
              Get started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--accent)]">OpenDDE</span>
              <span className="text-sm text-muted">Open Drug Design Engine</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/app/dashboard" className="hover:text-foreground transition-colors">
                Launch app
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-muted-2">
            Built with AlphaFold 3, P2Rank, ImmuneBuilder, and Claude.
            Inspired by Isomorphic Labs&apos; IsoDDE.
          </div>
        </div>
      </footer>
    </main>
  );
}
