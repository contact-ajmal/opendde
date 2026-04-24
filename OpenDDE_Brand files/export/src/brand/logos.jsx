// ─────────────────────────────────────────────────────────────
// Logo directions for OpenDDE
// 3 directions × 2 themes (dark, light). Each returns pure SVG
// so they compose as favicons, lockups, avatars, social cards.
// ─────────────────────────────────────────────────────────────

// Shared palette getters
const LOGO_COLORS = {
  dark: { bg: '#050a18', surface: '#0c1222', accent: '#00d4aa', accentAlt: '#00f0c0', text: '#e2e8f0', muted: '#8892a4' },
  light: { bg: '#faf9f7', surface: '#ffffff', accent: '#00a884', accentAlt: '#00c49a', text: '#1a1a2e', muted: '#4a4a60' },
};

// ─── Direction A: Hexagon + molecule (original, refined) ────
function LogoHexMolecule({ theme = 'dark', size = 80 }) {
  const c = LOGO_COLORS[theme];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`hm-stroke-${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.accent} />
          <stop offset="100%" stopColor={c.accentAlt} />
        </linearGradient>
        <radialGradient id={`hm-glow-${theme}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      {theme === 'dark' && <circle cx="50" cy="50" r="48" fill={`url(#hm-glow-${theme})`} />}
      <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="none" stroke={`url(#hm-stroke-${theme})`} strokeWidth="2.2" strokeLinejoin="round" />
      {/* Molecular graph */}
      <g stroke={c.accent} strokeWidth="1.6" strokeLinecap="round">
        <line x1="50" y1="32" x2="68" y2="44" opacity="0.55" />
        <line x1="50" y1="32" x2="34" y2="46" opacity="0.55" />
        <line x1="68" y1="44" x2="62" y2="66" opacity="0.55" />
        <line x1="34" y1="46" x2="40" y2="66" opacity="0.55" />
        <line x1="62" y1="66" x2="40" y2="66" opacity="0.55" />
      </g>
      <circle cx="50" cy="32" r="4.5" fill={c.accent} />
      <circle cx="68" cy="44" r="3.2" fill={c.accent} opacity="0.85" />
      <circle cx="34" cy="46" r="3.2" fill={c.accent} opacity="0.85" />
      <circle cx="62" cy="66" r="2.6" fill={c.accent} opacity="0.7" />
      <circle cx="40" cy="66" r="2.6" fill={c.accent} opacity="0.7" />
    </svg>
  );
}

// ─── Direction B: Ribbon / protein helix ────────────────────
// An alpha-helix ribbon rendered as a flowing sine — nods to
// protein structure. Nature-journal editorial vibe.
function LogoRibbon({ theme = 'dark', size = 80 }) {
  const c = LOGO_COLORS[theme];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`rb-stroke-${theme}`} x1="0" y1="0.3" x2="1" y2="0.7">
          <stop offset="0%" stopColor={c.accent} />
          <stop offset="100%" stopColor={c.accentAlt} />
        </linearGradient>
        <linearGradient id={`rb-fade-${theme}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.3" />
          <stop offset="50%" stopColor={c.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Outer ring for identity */}
      <circle cx="50" cy="50" r="44" fill="none" stroke={c.accent} strokeWidth="1.2" opacity={theme === 'dark' ? 0.18 : 0.22} />
      {/* Two helix strands */}
      <path
        d="M 18 50 Q 30 22, 42 50 T 66 50 T 82 50"
        fill="none"
        stroke={`url(#rb-stroke-${theme})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 18 50 Q 30 78, 42 50 T 66 50 T 82 50"
        fill="none"
        stroke={`url(#rb-fade-${theme})`}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Connecting rungs */}
      <g stroke={c.accent} strokeWidth="1.2" opacity="0.5">
        <line x1="24" y1="42" x2="24" y2="58" />
        <line x1="36" y1="38" x2="36" y2="62" />
        <line x1="48" y1="42" x2="48" y2="58" />
        <line x1="60" y1="38" x2="60" y2="62" />
        <line x1="72" y1="42" x2="72" y2="58" />
      </g>
    </svg>
  );
}

// ─── Direction C: Aperture / binding-site target ────────────
// Concentric aperture = "target" (protein target, binding pocket).
// Most distinctive of the three; reads as an icon at 16px.
function LogoAperture({ theme = 'dark', size = 80 }) {
  const c = LOGO_COLORS[theme];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`ap-stroke-${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.accent} />
          <stop offset="100%" stopColor={c.accentAlt} />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#ap-stroke-${theme})`} strokeWidth="2.4" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="30" fill="none" stroke={c.accent} strokeWidth="1.4" opacity="0.5" />
      {/* Aperture blades — 6 truncated wedges pointing to center */}
      <g stroke={c.accent} strokeWidth="2.4" strokeLinecap="round">
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + Math.cos(rad) * 16;
          const y1 = 50 + Math.sin(rad) * 16;
          const x2 = 50 + Math.cos(rad) * 30;
          const y2 = 50 + Math.sin(rad) * 30;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      {/* Center dot = ligand */}
      <circle cx="50" cy="50" r="6" fill={c.accent} />
      <circle cx="50" cy="50" r="10" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

// ─── Wordmark ────────────────────────────────────────────────
function Wordmark({ theme = 'dark', size = 28, weight = 700 }) {
  const c = LOGO_COLORS[theme];
  return (
    <span style={{
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: weight,
      fontSize: size,
      letterSpacing: '-0.025em',
      color: c.text,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      Open<span style={{ color: c.accent }}>DDE</span>
    </span>
  );
}

// ─── Lockup (horizontal) ────────────────────────────────────
function Lockup({ Logo, theme = 'dark', logoSize = 44, textSize = 26, showTag = false }) {
  const c = LOGO_COLORS[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Logo theme={theme} size={logoSize} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Wordmark theme={theme} size={textSize} />
        {showTag && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: textSize * 0.36,
            color: c.muted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Open Drug Design Engine
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Lockup (stacked) ────────────────────────────────────────
function LockupStacked({ Logo, theme = 'dark', logoSize = 64, textSize = 24 }) {
  const c = LOGO_COLORS[theme];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Logo theme={theme} size={logoSize} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <Wordmark theme={theme} size={textSize} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: textSize * 0.34,
          color: c.muted,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Open Drug Design Engine
        </span>
      </div>
    </div>
  );
}

Object.assign(window, {
  LogoHexMolecule, LogoRibbon, LogoAperture,
  Wordmark, Lockup, LockupStacked, LOGO_COLORS,
});
