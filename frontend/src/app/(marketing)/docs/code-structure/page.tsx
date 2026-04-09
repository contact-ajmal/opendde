import Link from 'next/link';

export const metadata = { title: 'Code Structure', description: 'Repository layout for frontend, backend, and services.' };

export default function CodeStructurePage() {
  return (
    <>
      <h1>Code structure</h1>

      <p>
        This page provides an overview of the OpenDDE repository layout.
      </p>

      <h2 id="top-level">Top-level layout</h2>

      <pre><code>{`opendde/
├── frontend/              # Next.js 14 app
├── backend/               # FastAPI Python backend
├── services/
│   ├── p2rank/            # Pocket prediction service
│   ├── rdkit/             # Cheminformatics service
│   └── immunebuilder/     # Antibody modeling service
├── docker-compose.yml     # Development orchestration
├── docker-compose.prod.yml # Production orchestration
├── .env.example           # Environment template
└── README.md`}</code></pre>

      <h2 id="frontend">Frontend structure</h2>

      <pre><code>{`frontend/src/
├── app/
│   ├── page.tsx           # Marketing homepage
│   ├── layout.tsx         # Root layout (metadata, skip-to-content)
│   ├── globals.css        # Theme variables, animations
│   ├── docs/              # Documentation site
│   │   ├── layout.tsx     # Docs sidebar layout
│   │   └── */page.tsx     # Individual doc pages
│   └── app/               # Main application (behind /app prefix)
│       ├── dashboard/     # Search + recent targets
│       ├── target/
│       │   └── [uniprotId]/
│       │       ├── page.tsx        # Target detail (3D viewer, pockets)
│       │       ├── pocket/[rank]/  # Pocket detail (ligands, SAR)
│       │       ├── compare/        # Pocket comparison
│       │       └── report/         # Druggability report
│       ├── antibody/      # Antibody prediction
│       └── analytics/     # Usage analytics dashboard
├── components/
│   ├── Navbar.tsx          # Global navigation
│   ├── StructureViewer.tsx # Mol* 3D viewer
│   ├── LigandTable.tsx     # Compound data table
│   ├── PocketRadar.tsx     # Pocket composition radar chart
│   ├── SARPlot.tsx         # Structure-activity scatter plot
│   ├── CommandPalette.tsx  # Cmd+K search palette
│   ├── AssistantDrawer.tsx # AI chat drawer
│   └── ...
└── lib/
    └── api.ts             # API client with error handling`}</code></pre>

      <h2 id="backend">Backend structure</h2>

      <pre><code>{`backend/
├── main.py                # FastAPI app, middleware, router registration
├── routers/
│   ├── targets.py         # Target resolution, structure serving
│   ├── pockets.py         # Pocket prediction, residue properties
│   ├── ligands.py         # ChEMBL data fetching
│   ├── predictions.py     # Complex prediction workflow
│   ├── antibody.py        # Antibody structure prediction
│   ├── properties.py      # Molecular properties, SMILES validation
│   ├── assistant.py       # Claude AI integration
│   ├── reports.py         # Druggability reports (JSON)
│   ├── report_pdf.py      # PDF report generation
│   ├── search.py          # Global search
│   ├── stats.py           # Summary statistics
│   ├── analytics.py       # Analytics dashboard data
│   ├── export.py          # CSV export
│   ├── similar.py         # Similar target discovery
│   ├── safety.py          # Open Targets safety data
│   └── activity_cliffs.py # Activity cliff detection
└── requirements.txt`}</code></pre>

      <p><Link href="/docs/pull-request-guide">Next: Pull request guide &rarr;</Link></p>
    </>
  );
}
