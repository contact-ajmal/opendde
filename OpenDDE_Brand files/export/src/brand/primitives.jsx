// ─────────────────────────────────────────────────────────────
// Shared brand primitives: surfaces, swatches, helpers
// ─────────────────────────────────────────────────────────────

const FONTS = {
  heading: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  serif: "'Source Serif 4', Georgia, serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

const PALETTE = {
  dark: {
    bg: '#050a18',
    surface: '#0c1222',
    surfaceHover: '#131c30',
    surfaceAlt: '#182036',
    text: '#e2e8f0',
    textSecondary: '#8892a4',
    textTertiary: '#5a6478',
    accent: '#00d4aa',
    accentHover: '#00f0c0',
    accentMuted: 'rgba(0, 212, 170, 0.15)',
    border: 'rgba(255, 255, 255, 0.06)',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
  light: {
    bg: '#faf9f7',
    surface: '#ffffff',
    surfaceHover: '#f5f3ef',
    surfaceAlt: '#efece6',
    text: '#1a1a2e',
    textSecondary: '#4a4a60',
    textTertiary: '#8a8a9a',
    accent: '#00a884',
    accentHover: '#00c49a',
    accentMuted: 'rgba(0, 168, 132, 0.10)',
    border: 'rgba(0, 0, 0, 0.06)',
    danger: '#dc2626',
    warning: '#d97706',
  },
};

function GridDots({ theme = 'dark', opacity = 0.06, size = 40 }) {
  const color = theme === 'dark' ? 'white' : 'black';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='1' fill='${color}'/></svg>`;
  return {
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };
}

function AccentMesh({ theme = 'dark', position = 'tl', intensity = 0.28 }) {
  const c = PALETTE[theme].accent;
  const pos = {
    tl: { top: '-30%', left: '-20%' },
    tr: { top: '-30%', right: '-20%' },
    bl: { bottom: '-30%', left: '-20%' },
    br: { bottom: '-30%', right: '-20%' },
    c: { top: '20%', left: '25%' },
  }[position];
  return (
    <div style={{
      position: 'absolute',
      width: '70%',
      aspectRatio: '1 / 1',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${c} 0%, transparent 60%)`,
      opacity: intensity,
      filter: 'blur(40px)',
      pointerEvents: 'none',
      ...pos,
    }} />
  );
}

function Swatch({ color, name, hex, textColor, small = false }) {
  const h = small ? 96 : 140;
  return (
    <div style={{ width: small ? 120 : 160 }}>
      <div style={{
        height: h, borderRadius: 8, background: color,
        border: '1px solid rgba(0,0,0,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        {textColor && (
          <span style={{
            position: 'absolute', top: 10, left: 12,
            fontSize: 11, fontFamily: FONTS.mono, color: textColor, opacity: 0.7,
            letterSpacing: '0.04em',
          }}>Aa</span>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', fontFamily: FONTS.body }}>{name}</div>
        <div style={{ fontSize: 11, fontFamily: FONTS.mono, color: '#8a8a9a', marginTop: 2 }}>{hex}</div>
      </div>
    </div>
  );
}

function MolecularArt({ theme = 'dark', width = 400, height = 240, variant = 'ribbon' }) {
  const c = PALETTE[theme];
  if (variant === 'ribbon') {
    return (
      <svg width={width} height={height} viewBox="0 0 400 240" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`art-r-${theme}-${width}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={c.accentHover} stopOpacity="0.4" />
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
                fill={`url(#art-r-${theme}-${width})`}
                opacity={0.35 + 0.65 * Math.abs(Math.cos(i * 0.55))}
              />
            );
          })}
        </g>
        <circle cx="200" cy="90" r="6" fill={c.accent} />
        <circle cx="200" cy="90" r="14" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }
  if (variant === 'scatter') {
    const pts = Array.from({ length: 60 }).map((_, i) => {
      const seed = i * 9301 + 49297;
      const rx = ((seed * 233280) % 1000) / 1000;
      const ry = ((seed * 49297) % 1000) / 1000;
      const rr = ((seed * 9301) % 1000) / 1000;
      const ro = ((seed * 31) % 1000) / 1000;
      return {
        x: 30 + rx * 340,
        y: 30 + ry * 180,
        r: 2 + rr * 6,
        o: 0.3 + ro * 0.7,
      };
    });
    return (
      <svg width={width} height={height} viewBox="0 0 400 240" style={{ display: 'block' }}>
        <line x1="30" y1="210" x2="380" y2="210" stroke={c.border} strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="210" stroke={c.border} strokeWidth="1" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={c.accent} opacity={p.o} />
        ))}
        <line x1="30" y1="200" x2="380" y2="40" stroke={c.accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
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
      <svg width={width} height={height} viewBox="0 0 400 240" style={{ display: 'block' }}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={c.accent} strokeWidth="1.2" opacity="0.5" />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={c.accent} opacity={0.45 + (n.r / 30)} />
        ))}
      </svg>
    );
  }
  return null;
}

Object.assign(window, { FONTS, PALETTE, GridDots, AccentMesh, Swatch, MolecularArt });
