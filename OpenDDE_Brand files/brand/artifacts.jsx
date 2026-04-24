// ─────────────────────────────────────────────────────────────
// Brand artifacts: icon grid, social cards, avatars, posters
// ─────────────────────────────────────────────────────────────

// ── Icon set — stroke-based, 24-grid, consistent joins ─────
const IconGrid = ({ theme = 'dark' }) => {
  const c = PALETTE[theme];
  const icons = [
    { name: 'Target', svg: (
      <g>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill={c.accent} stroke="none" />
      </g>
    )},
    { name: 'Pocket', svg: (
      <g>
        <path d="M4 10 C 4 5, 20 5, 20 10 L 20 18 C 20 20, 16 21, 12 21 C 8 21, 4 20, 4 18 Z" />
        <circle cx="12" cy="13" r="2" fill={c.accent} stroke="none" />
      </g>
    )},
    { name: 'Ligand', svg: (
      <g>
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="16" cy="8" r="2.5" />
        <circle cx="12" cy="16" r="2.5" />
        <line x1="10" y1="9" x2="14" y2="9" />
        <line x1="9" y1="10" x2="11" y2="14" />
        <line x1="15" y1="10" x2="13" y2="14" />
      </g>
    )},
    { name: 'Helix', svg: (
      <g>
        <path d="M6 4 Q 18 8, 6 12 Q 18 16, 6 20" />
        <path d="M18 4 Q 6 8, 18 12 Q 6 16, 18 20" opacity="0.5" />
      </g>
    )},
    { name: 'Lab', svg: (
      <g>
        <path d="M9 3 V 10 L 4 20 C 4 21, 5 21, 6 21 H 18 C 19 21, 20 21, 20 20 L 15 10 V 3" />
        <line x1="8" y1="3" x2="16" y2="3" />
      </g>
    )},
    { name: 'Scan', svg: (
      <g>
        <path d="M4 8 V 5 C 4 4, 5 4, 6 4 H 9" />
        <path d="M15 4 H 18 C 19 4, 20 4, 20 5 V 8" />
        <path d="M20 16 V 19 C 20 20, 19 20, 18 20 H 15" />
        <path d="M9 20 H 6 C 5 20, 4 20, 4 19 V 16" />
        <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" stroke={c.accent} />
      </g>
    )},
    { name: 'Graph', svg: (
      <g>
        <path d="M4 18 L 9 13 L 13 15 L 20 6" />
        <circle cx="9" cy="13" r="1.5" fill={c.accent} stroke="none" />
        <circle cx="13" cy="15" r="1.5" fill={c.accent} stroke="none" />
        <circle cx="20" cy="6" r="1.5" fill={c.accent} stroke="none" />
      </g>
    )},
    { name: 'Dock', svg: (
      <g>
        <rect x="3" y="8" width="8" height="8" rx="1" />
        <circle cx="17" cy="12" r="3" fill={c.accent} stroke="none" />
        <line x1="11" y1="12" x2="14" y2="12" strokeDasharray="1.5 1.5" />
      </g>
    )},
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
      {icons.map(ic => (
        <div key={ic.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 10,
            background: c.surfaceAlt,
            border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {ic.svg}
            </svg>
          </div>
          <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: c.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ic.name}</div>
        </div>
      ))}
    </div>
  );
};

// ── OG / social card (1200×630 → scaled) ────────────────────
function SocialOG({ theme = 'dark', Logo = LogoHexMolecule, width = 600, height = 315 }) {
  const c = PALETTE[theme];
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${c.bg} 0%, ${c.surface} 100%)`,
      color: c.text, fontFamily: FONTS.body,
    }}>
      <div style={{ position: 'absolute', inset: 0, ...GridDots({ theme, opacity: theme === 'dark' ? 0.06 : 0.08, size: 28 }) }} />
      <AccentMesh theme={theme} position="br" intensity={theme === 'dark' ? 0.25 : 0.18} />
      <div style={{
        position: 'absolute', top: width * 0.05, left: width * 0.05,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        <Logo theme={theme} size={width * 0.1} />
      </div>
      <div style={{
        position: 'absolute', bottom: width * 0.07, left: width * 0.05, right: width * 0.05,
      }}>
        <div style={{
          fontFamily: FONTS.heading, fontSize: width * 0.06, fontWeight: 700,
          lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: 10,
        }}>
          Open Drug Design Engine
        </div>
        <div style={{ fontSize: width * 0.024, color: c.textSecondary, maxWidth: '75%', lineHeight: 1.4 }}>
          Open-source computational drug design. Pocket discovery, ligand intelligence,
          complex prediction — in minutes, not months.
        </div>
        <div style={{
          marginTop: 14, display: 'flex', gap: 8, alignItems: 'center',
          fontFamily: FONTS.mono, fontSize: width * 0.02, color: c.accent,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
          opendde.org · MIT
        </div>
      </div>
    </div>
  );
}

// ── LinkedIn banner (1584×396 → scaled) ─────────────────────
function LinkedInBanner({ theme = 'dark', Logo = LogoHexMolecule, width = 720 }) {
  const c = PALETTE[theme];
  const height = width * (396 / 1584);
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(90deg, ${c.bg} 0%, ${c.surface} 60%, ${c.bg} 100%)`,
      color: c.text, fontFamily: FONTS.body, display: 'flex', alignItems: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, ...GridDots({ theme, opacity: 0.05, size: 24 }) }} />
      <AccentMesh theme={theme} position="tr" intensity={0.2} />
      <div style={{ position: 'absolute', right: width * 0.06, top: '50%', transform: 'translateY(-50%)', opacity: 0.85 }}>
        <MolecularArt theme={theme} width={width * 0.45} height={height * 0.85} variant="network" />
      </div>
      <div style={{ paddingLeft: width * 0.06, zIndex: 2, maxWidth: '55%' }}>
        <Logo theme={theme} size={width * 0.05} />
        <div style={{
          fontFamily: FONTS.heading, fontSize: width * 0.032, fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: 12,
        }}>
          From protein target to druggability —<br/>
          <span style={{ color: c.accent }}>in minutes, not months.</span>
        </div>
      </div>
    </div>
  );
}

// ── X / Twitter post card (1600×900 → scaled) ──────────────
function TwitterCard({ theme = 'dark', Logo = LogoHexMolecule, width = 500 }) {
  const c = PALETTE[theme];
  const height = width * (9 / 16);
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: c.bg, color: c.text, fontFamily: FONTS.body,
    }}>
      <div style={{ position: 'absolute', inset: 0, ...GridDots({ theme, opacity: 0.07, size: 30 }) }} />
      <AccentMesh theme={theme} position="tl" intensity={0.22} />
      <div style={{
        position: 'absolute', top: 24, left: 28, right: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Logo theme={theme} size={40} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          v1.0 · release
        </span>
      </div>
      <div style={{ position: 'absolute', left: 28, right: 28, top: '38%' }}>
        <div style={{
          fontFamily: FONTS.heading, fontSize: width * 0.048, fontWeight: 700,
          lineHeight: 1.08, letterSpacing: '-0.02em',
        }}>
          22 druggable pockets.
        </div>
        <div style={{
          fontFamily: FONTS.heading, fontSize: width * 0.048, fontWeight: 700,
          lineHeight: 1.08, letterSpacing: '-0.02em', color: c.accent,
        }}>
          3 minutes.
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: c.textSecondary, maxWidth: '70%', lineHeight: 1.5 }}>
          Self-hosted drug design workbench. AlphaFold 3 · P2Rank · ChEMBL · RDKit.
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 20, left: 28, right: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.accent }}>github.com/opendde</span>
        <span style={{
          fontFamily: FONTS.mono, fontSize: 10, color: c.textTertiary,
          padding: '4px 8px', border: `1px solid ${c.border}`, borderRadius: 4,
        }}>MIT · PRS WELCOME</span>
      </div>
    </div>
  );
}

// ── Circle avatar (profile pic) ─────────────────────────────
function Avatar({ theme = 'dark', Logo = LogoHexMolecule, size = 120 }) {
  const c = PALETTE[theme];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${c.surface} 0%, ${c.bg} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${c.border}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <AccentMesh theme={theme} position="c" intensity={0.22} />
      <div style={{ zIndex: 1 }}>
        <Logo theme={theme} size={size * 0.6} />
      </div>
    </div>
  );
}

// ── Conference poster tile (portrait A-sheet) ──────────────
function PosterTile({ theme = 'dark', Logo = LogoHexMolecule, width = 320 }) {
  const c = PALETTE[theme];
  const height = width * (297 / 210); // A-ratio
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: c.bg, color: c.text, fontFamily: FONTS.body,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', inset: 0, ...GridDots({ theme, opacity: 0.05, size: 26 }) }} />
      <AccentMesh theme={theme} position="bl" intensity={0.24} />
      <div style={{ padding: '24px 22px 0', zIndex: 1 }}>
        <Logo theme={theme} size={34} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <MolecularArt theme={theme} width={width * 0.82} height={height * 0.35} variant="ribbon" />
      </div>
      <div style={{ padding: '0 22px 24px', zIndex: 1 }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 11, fontStyle: 'italic', color: c.textSecondary, marginBottom: 6 }}>
          Open-source drug design
        </div>
        <div style={{
          fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700,
          lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>
          Every protein,<br/>
          <span style={{ color: c.accent }}>druggability-assessed.</span>
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: FONTS.mono, fontSize: 9, color: c.textTertiary,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <span>opendde.org</span>
          <span>MIT · 2026</span>
        </div>
      </div>
    </div>
  );
}

// ── Favicon strip — logo at 16/24/32/48/64 ─────────────────
function FaviconStrip({ theme = 'dark', Logo = LogoHexMolecule }) {
  const c = PALETTE[theme];
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
      {[16, 24, 32, 48, 64].map(s => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: Math.max(s + 16, 40), height: Math.max(s + 16, 40),
            background: c.bg, borderRadius: 6, border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Logo theme={theme} size={s} />
          </div>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#8a8a9a' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  IconGrid, SocialOG, LinkedInBanner, TwitterCard, Avatar, PosterTile, FaviconStrip,
});
