'use client';

import React from 'react';

// ─── Colors ──────────────────────────────────────────────────
// These match the var() definitions in globals.css
const BRAND_COLORS = {
  accent: '#00d4aa',
  accentAlt: '#00f0c0',
  textSecondary: '#8892a4',
};

// ─── Logo Direction C: Aperture ─────────────────────────────
export function LogoAperture({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ap-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND_COLORS.accent} />
          <stop offset="100%" stopColor={BRAND_COLORS.accentAlt} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ap-stroke)" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="30" fill="none" stroke={BRAND_COLORS.accent} strokeWidth="1.4" opacity="0.5" />
      <g stroke={BRAND_COLORS.accent} strokeWidth="2.4" strokeLinecap="round">
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + Math.cos(rad) * 16;
          const y1 = 50 + Math.sin(rad) * 16;
          const x2 = 50 + Math.cos(rad) * 30;
          const y2 = 50 + Math.sin(rad) * 30;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <circle cx="50" cy="50" r="6" fill={BRAND_COLORS.accent} />
      <circle cx="50" cy="50" r="10" fill="none" stroke={BRAND_COLORS.accent} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

// ─── Logo Direction A: Hex Molecule ─────────────────────────
export function LogoHexMolecule({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="hm-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND_COLORS.accent} />
          <stop offset="100%" stopColor={BRAND_COLORS.accentAlt} />
        </linearGradient>
      </defs>
      <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="none" stroke="url(#hm-stroke)" strokeWidth="2.2" strokeLinejoin="round" />
      <g stroke={BRAND_COLORS.accent} strokeWidth="1.6" strokeLinecap="round">
        <line x1="50" y1="32" x2="68" y2="44" opacity="0.55" />
        <line x1="50" y1="32" x2="34" y2="46" opacity="0.55" />
        <line x1="68" y1="44" x2="62" y2="66" opacity="0.55" />
        <line x1="34" y1="46" x2="40" y2="66" opacity="0.55" />
        <line x1="62" y1="66" x2="40" y2="66" opacity="0.55" />
      </g>
      <circle cx="50" cy="32" r="4.5" fill={BRAND_COLORS.accent} />
      <circle cx="68" cy="44" r="3.2" fill={BRAND_COLORS.accent} opacity="0.85" />
      <circle cx="34" cy="46" r="3.2" fill={BRAND_COLORS.accent} opacity="0.85" />
      <circle cx="62" cy="66" r="2.6" fill={BRAND_COLORS.accent} opacity="0.7" />
      <circle cx="40" cy="66" r="2.6" fill={BRAND_COLORS.accent} opacity="0.7" />
    </svg>
  );
}

// ─── Molecular Art Motifs ───────────────────────────────────
export function MolecularArt({ 
  variant = 'ribbon', 
  width = 400, 
  height = 240,
  className = "" 
}: { 
  variant?: 'ribbon' | 'scatter' | 'network', 
  width?: number | string, 
  height?: number | string,
  className?: string
}) {
  if (variant === 'ribbon') {
    return (
      <svg width={width} height={height} viewBox="0 0 400 240" className={className}>
        <defs>
          <linearGradient id="art-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BRAND_COLORS.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={BRAND_COLORS.accentAlt} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <g transform="translate(0, 120)">
          {Array.from({ length: 28 }).map((_, i) => {
            const x = 30 + i * 13;
            const y = Math.sin(i * 0.55) * 50;
            const w = 16 + Math.cos(i * 0.55) * 4;
            return (
              <rect
                key={i}
                x={x - w / 2}
                y={y - 8}
                width={w}
                height={16}
                rx="3"
                fill="url(#art-ribbon)"
                opacity={0.15 + 0.45 * Math.abs(Math.cos(i * 0.55))}
              />
            );
          })}
        </g>
      </svg>
    );
  }

  if (variant === 'network') {
    const nodes = [
      { x: 200, y: 120, r: 12 },
      { x: 140, y: 80, r: 8 },
      { x: 260, y: 80, r: 8 },
      { x: 120, y: 160, r: 6 },
      { x: 280, y: 160, r: 6 },
      { x: 200, y: 60, r: 6 },
      { x: 200, y: 190, r: 8 },
      { x: 80, y: 120, r: 5 },
      { x: 320, y: 120, r: 5 },
    ];
    const edges = [[0, 1], [0, 2], [0, 6], [1, 3], [2, 4], [1, 5], [2, 5], [3, 7], [4, 8]];
    return (
      <svg width={width} height={height} viewBox="0 0 400 240" className={className}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={BRAND_COLORS.accent} strokeWidth="1.2" opacity="0.15" />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={BRAND_COLORS.accent} opacity={0.1 + (n.r / 60)} />
        ))}
      </svg>
    );
  }

  return null;
}

// ─── Accent Mesh (Glow) ────────────────────────────────────
export function AccentMesh({ 
  position = 'tl', 
  intensity = 0.28,
  className = ""
}: { 
  position?: 'tl' | 'tr' | 'bl' | 'br' | 'c', 
  intensity?: number,
  className?: string
}) {
  const pos = {
    tl: { top: '-30%', left: '-20%' },
    tr: { top: '-30%', right: '-20%' },
    bl: { bottom: '-30%', left: '-20%' },
    br: { bottom: '-30%', right: '-20%' },
    c: { top: '20%', left: '25%' },
  }[position];

  return (
    <div 
      className={className}
      style={{
        position: 'absolute',
        width: '70%',
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${BRAND_COLORS.accent} 0%, transparent 60%)`,
        opacity: intensity,
        filter: 'blur(40px)',
        pointerEvents: 'none',
        ...pos,
      }} 
    />
  );
}
