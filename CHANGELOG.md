# Changelog

All notable changes to OpenDDE are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] — 2026-04-09

### Added
- **Documentation site** (`/docs`) — 21 pages with sidebar navigation, search, and code blocks
- **Learn section** (`/learn`) — 4 educational articles with reading progress bar and TOC
  - Drug Discovery 101, How OpenDDE Works, Understanding Proteins, From Target to Drug
- **Professional homepage** — Hero section, animated protein visual, stats bar, drug discovery timeline, visual walkthrough, video section, use cases, tech stack grid, open source mission, attribution, professional footer
- **Navigation redesign** — Dropdown menus, mobile hamburger drawer, breadcrumbs, frosted glass on scroll
- **Route restructuring** — Marketing site at `/`, application under `/app/` prefix
- **Visual refinement** — Plus Jakarta Sans + Inter + Source Serif 4 + JetBrains Mono fonts, refined color palette (#050a18 bg, #00d4aa accent), card/button/table/badge component system
- **SEO** — Sitemap.xml, robots.txt, JSON-LD structured data, OG image, Twitter cards, meta descriptions on all pages
- **Responsive design** — Mobile-friendly 3D viewer heights, collapsible sidebar, responsive tables
- **Accessibility** — `prefers-reduced-motion` support, aria-labels, font preloading
- **Performance** — Cache-Control headers, font preloading

### Changed
- All application routes moved from `/target/...` to `/app/target/...`
- Homepage completely redesigned from dashboard to marketing/educational site
- Footer upgraded from simple to professional 3-column layout
- Color system updated: emerald → teal-emerald (#00d4aa), deeper navy backgrounds
- Border system changed from solid colors to rgba transparency

---

## [2.0.0] — 2026-04-08

### Added
- **Activity cliff detection** — Pairwise Tanimoto similarity + activity ratio analysis
- **Response caching middleware** — In-memory GET cache (1h TTL, 200 max entries) with x-cache headers
- **Structure file caching** — Cache-Control: public, max-age=86400 on CIF files
- **User-friendly error handling** — Network errors, 404s, 500s mapped to helpful messages
- **SEO metadata** — Open Graph tags, template-based titles
- **Accessibility** — focus-visible outlines, aria-labels, skip-to-content link
- **React.memo** on StructureViewer, LigandTable, SARPlot, PocketRadar
- **Dynamic imports** — StructureViewer (ssr:false), SARPlot, PocketRadar, MoleculeEditor
- **Production Docker Compose** — gunicorn with 4 workers, no exposed internal ports
- **Comprehensive README** — Architecture diagram, services table, full feature list

### Changed
- Error messages in `api.ts` now user-friendly instead of raw HTTP errors
- Health checks added to all 6 Docker services with `depends_on` conditions

---

## [1.4.0] — 2026-04-08

### Added
- **Activity cliff detection** endpoint (`POST /activity-cliffs/{uniprot_id}`)
- Collapsible activity cliffs section on pocket detail page
- Side-by-side ligand comparison with similarity bar and activity ratio badge

---

## [1.3.0] — 2026-04-07

### Added
- **Pocket comparison** radar chart for visualizing pocket composition across multiple pockets
- **SAR scatter plot** on pocket detail page (molecular weight vs. activity)

---

## [1.2.0] — 2026-04-07

### Added
- **Analytics dashboard** (`/analytics`) — Charts for target exploration timeline, pocket score distribution, ligand activity ranges, top targets
- Recharts integration for data visualization

---

## [1.1.0] — 2026-04-06

### Added
- **AI assistant** — Claude-powered chat drawer with target/pocket context
- **Auto-generated pocket summaries** — Cached druggability analysis per pocket
- **Smart ligand suggestions** — AI-suggested molecular modifications per pocket
- **Open Targets safety profiles** — Known safety signals for targets
- **Similar target discovery** — Sequence homology search for related proteins

---

## [1.0.0] — 2026-04-05

### Added
- **Core platform** — Target resolution, 3D structure viewing, pocket prediction, ligand browsing
- **Pocket detail pages** — Residue properties, composition analysis, pocket radar chart
- **Ligand intelligence** — ChEMBL integration, activity data, clinical phases, 2D structures
- **Complex prediction** — AlphaFold 3 job preparation, upload, and visualization
- **Antibody modeling** — ImmuneBuilder integration with CDR loop annotation
- **Molecular properties** — RDKit-based Lipinski scoring, SMILES validation, 2D depiction
- **Druggability reports** — JSON and PDF export
- **Search and navigation** — Global search, command palette (Cmd+K)
- **Dark/light theme** toggle
- **Docker Compose** orchestration with 6 services
- **Pocket residue interaction map** — 2D radial diagram of pocket residue properties

---

## [0.5.0] — 2026-04-04

### Added
- Molecular editor for SMILES input
- CSV export for pockets and ligands
- Pocket residue chemical properties endpoint

---

## [0.4.0] — 2026-04-03

### Added
- AlphaFold 3 complex prediction workflow (prepare → submit → upload → view)
- Prediction status tracking and history

---

## [0.3.0] — 2026-04-02

### Added
- ChEMBL ligand integration with sortable table
- Clinical phase badges and activity formatting
- 2D molecule rendering via RDKit depiction endpoint

---

## [0.2.0] — 2026-04-01

### Added
- P2Rank pocket prediction integration
- Pocket list with druggability scores
- 3D structure viewer with pocket highlighting (Mol*)

---

## [0.1.0] — 2026-03-31

### Added
- Initial project setup
- Next.js frontend with Tailwind CSS
- FastAPI backend scaffold
- Docker Compose with frontend, backend, and Redis
- Target resolution via UniProt API
- AlphaFold structure download and serving
- Supabase database integration
