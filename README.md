# OpenDDE — Open Drug Design Engine

Open-source drug design workbench inspired by [Isomorphic Labs' IsoDDE](https://isomorphiclabs.com/).

Enter a protein drug target → discover where drugs can bind → explore known drugs → predict how they bind.

---

## What is OpenDDE?

OpenDDE is a self-hosted platform that chains together state-of-the-art computational biology tools into a single workflow:

1. **Resolve** a protein target by UniProt ID or gene name
2. **Discover** druggable binding pockets with P2Rank
3. **Explore** known drugs and bioactive compounds from ChEMBL
4. **Predict** protein–ligand binding complexes with AlphaFold 3
5. **Model** therapeutic antibodies with ImmuneBuilder
6. **Analyze** druggability with AI-powered insights

Everything runs locally via Docker Compose — no cloud GPU required.

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/opendde.git && cd opendde
cp .env.example .env   # edit with your Supabase + Claude API credentials
docker compose up --build
open http://localhost:3000
```

For production:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Docker Compose (6 services)                │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐ │
│  │ Frontend │───▶│ Backend  │───▶│  P2Rank  │    │ ImmuneBuilder │ │
│  │ Next.js  │    │ FastAPI  │    │ Java+Py  │    │ ABodyBuilder2 │ │
│  │ :3000    │    │ :8000    │    │ :8001    │    │ :8002         │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └───────────────┘ │
│                       │                                             │
│            ┌──────────┼──────────┐                                  │
│            │          │          │                                   │
│       ┌────┴───┐ ┌────┴───┐ ┌───┴────┐                             │
│       │  Redis │ │ RDKit  │ │ Claude │                              │
│       │  :6379 │ │ :8003  │ │  API   │                              │
│       └────────┘ └────────┘ └────────┘                              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
           ┌─────────────┼──────────────────┐
           ▼             ▼                  ▼
     ┌──────────┐  ┌──────────┐       ┌──────────┐
     │ Supabase │  │ External │       │ External │
     │ Postgres │  │   APIs   │       │   APIs   │
     │          │  │ UniProt  │       │  ChEMBL  │
     │          │  │ AlphaFold│       │  PubChem │
     │          │  │OpenTargets│       │          │
     └──────────┘  └──────────┘       └──────────┘
```

### Request Flow

```
User search → Frontend → POST /api/v1/target/resolve → UniProt API
                        → POST /api/v1/pockets         → P2Rank service
                        → GET  /api/v1/ligands/{id}     → ChEMBL pipeline
                        → POST /api/v1/complex/prepare  → AF3 Server JSON
                        → POST /api/v1/antibody/predict  → ImmuneBuilder
                        → POST /api/v1/assistant/chat   → Claude API (SSE)
                        → POST /api/v1/properties/batch → RDKit service
```

All responses are cached in Supabase (7-day TTL) with Redis as a fast layer.

---

## Features

### Pocket Discovery — P2Rank
Machine-learning binding site prediction on protein structures. Identifies druggable pockets with scores, druggability estimates, and residue lists. Results visualized as colored highlights on the 3D structure.

### Ligand Intelligence — ChEMBL
Fetches known drugs and bioactive compounds for a target with IC50, Ki, and Kd activity data. Includes clinical trial phase, 2D structure images from PubChem, and CSV export.

### Druglikeness Scoring — RDKit
Real-time molecular property calculation: Lipinski's Rule of Five, molecular weight, LogP, hydrogen bond donors/acceptors, and Tanimoto similarity for compound comparison.

### Complex Prediction — AlphaFold 3 Server
Generates AF3-compatible input JSON for protein–ligand pairs. Semi-automated workflow: prepare → submit to AF3 Server → upload result → view predicted complex in 3D.

### Antibody Modeling — ImmuneBuilder
Predicts antibody 3D structures from VH/VL sequences using ABodyBuilder2. Identifies and visualizes all six CDR loops (Chothia numbering).

### AI Drug Design Assistant — Claude
Context-aware AI assistant that understands the current target, pocket, and ligand data. Answers questions about druggability, suggests modifications, and explains binding mechanisms. Powered by Claude with real-time SSE streaming.

### AI Pocket Summaries
Auto-generated pocket analysis summaries using Claude. Cached in Supabase (30-day TTL) for instant access on subsequent visits.

### Smart Ligand Suggestions
AI-generated molecular modification suggestions based on known ligands and pocket chemistry. Each suggestion includes a rationale, proposed SMILES, and expected effect.

### Druggability Reports + PDF Export
Comprehensive druggability assessment with a weighted score, verdict, pocket analysis charts, clinical phase distribution, and top ligand table. Export as PDF with one click.

### Analytics Dashboard
Platform-wide analytics: druggability distribution, clinical phase breakdown, activity distribution, exploration timeline, and most-explored targets.

### SAR Analysis
Structure-Activity Relationship scatter plot (MW vs activity on log scale), activity cliff detection (structurally similar compounds with dramatically different activity), and pocket comparison radar charts.

### Molecule Editor
Draw molecules with JSME and feed them directly into the prediction workflow. Supports SMILES input and structure editing.

### Safety & Tractability Profiles
OpenTargets integration for tractability assessment, safety signals, and disease associations for each target.

### Similar Targets Discovery
InterPro domain-based search to find related druggable targets. Identifies which similar targets have already been explored in OpenDDE.

### Ligand Comparison
Side-by-side comparison of predicted complexes for a target with ipTM and pLDDT scores, sortable table, and Recharts bar chart.

### Export
Download pockets (CSV), ligands (CSV), and protein structures (CIF) directly from the UI.

---

## How It Differs from GeneXplor

| | **GeneXplor** | **OpenDDE** |
|---|---|---|
| **Purpose** | Gene knowledge aggregation | Drug design prediction |
| **Input** | Gene symbol | Protein target |
| **Output** | Literature, variants, expression | Pockets, ligands, complexes |
| **Engines** | LLM summarization | P2Rank, AF3, ImmuneBuilder, RDKit, Claude |
| **Overlap** | None | None |

GeneXplor answers "what do we know about this gene?" OpenDDE answers "how can we drug this protein?"

---

## Engine Swap Architecture

OpenDDE's prediction engines are designed to be swappable. Each engine implements a consistent interface:

```python
# Abstract interface
class DockingEngine:
    """Base class for structure prediction engines."""

    async def predict(
        self,
        structure_path: str,
        ligand_smiles: str,
        pocket_residues: list[str],
    ) -> PredictionResult:
        raise NotImplementedError

    @property
    def name(self) -> str:
        raise NotImplementedError
```

To add a new engine (e.g., Boltz-2):

```python
class Boltz2Engine(DockingEngine):
    """Boltz-2 cloud docking engine with affinity prediction."""

    async def predict(self, structure_path, ligand_smiles, pocket_residues):
        # 1. Submit job to Boltz-2 API
        job = await self.client.submit(structure_path, ligand_smiles)
        # 2. Poll for completion
        result = await self.client.wait(job.id)
        # 3. Return standardized result
        return PredictionResult(
            complex_path=result.output_path,
            confidence=result.affinity_score,
            engine="boltz2",
        )

    @property
    def name(self):
        return "Boltz-2"
```

Register in `main.py` and the frontend picks it up automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, 3Dmol.js, Recharts, Framer Motion |
| **Backend** | FastAPI, httpx, Pydantic, aiofiles, reportlab |
| **AI** | Claude API (Sonnet) with SSE streaming |
| **Engines** | P2Rank 2.5.1 (Java), ImmuneBuilder/ABodyBuilder2, RDKit |
| **Data sources** | UniProt, AlphaFold DB, ChEMBL, PubChem, OpenTargets |
| **Database** | Supabase (PostgreSQL) with 7-day TTL cache |
| **Cache** | Redis + in-memory response cache (1h TTL) |
| **Infrastructure** | Docker Compose (6 containers, 3 volumes) |

---

## Services

| Service | Port | Description |
|---|---|---|
| **frontend** | 3000 | Next.js 14 app with App Router |
| **backend** | 8000 | FastAPI with 16 router modules |
| **p2rank** | 8001 | P2Rank pocket prediction |
| **immunebuilder** | 8002 | ABodyBuilder2 antibody modeling |
| **rdkit** | 8003 | Molecular properties + similarity |
| **redis** | 6379 | Fast cache layer |

---

## Roadmap

- [ ] **Boltz-2 cloud** — docking with predicted binding affinity
- [ ] **AutoDock Vina** — classical docking as a local engine option
- [ ] **IsoDDE integration** — connect to Isomorphic Labs' platform when API available
- [ ] **Batch mode** — screen compound libraries against a target
- [ ] **Protein–protein docking** — extend AF3 workflow to protein complexes

---

## Project Structure

```
opendde/
├── frontend/                 # Next.js 14 app
│   └── src/
│       ├── app/              # App Router pages
│       │   ├── analytics/    # Analytics dashboard
│       │   ├── antibody/     # Antibody prediction
│       │   └── target/       # Target + pocket detail pages
│       ├── components/       # 25+ React components
│       │   ├── StructureViewer   # 3Dmol.js protein viewer
│       │   ├── AssistantDrawer   # AI chat drawer
│       │   ├── SARPlot           # SAR scatter chart
│       │   ├── PocketRadar       # Pocket comparison radar
│       │   ├── MoleculeEditor    # JSME molecule editor
│       │   └── ...
│       └── lib/              # API helpers, types
├── backend/                  # FastAPI server
│   ├── routers/              # 16 API route modules
│   ├── services/             # External API integrations
│   │   ├── database.py       # Supabase + caching
│   │   ├── opentargets.py    # OpenTargets GraphQL
│   │   ├── similar.py        # InterPro-based search
│   │   └── ...
│   ├── engines/              # Prediction engine wrappers
│   │   ├── p2rank.py
│   │   └── rdkit_client.py
│   └── models/               # Pydantic schemas
├── services/
│   ├── p2rank/               # P2Rank microservice
│   ├── immunebuilder/        # ImmuneBuilder microservice
│   └── rdkit/                # RDKit microservice
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production
├── .env.example
└── README.md
```

---

## License

MIT

---

## Acknowledgments

- **[Isomorphic Labs](https://isomorphiclabs.com/)** — inspiration (IsoDDE)
- **[DeepMind](https://deepmind.google/)** — AlphaFold 3, AlphaFold DB
- **[SIRET Research Group](https://siret.ms.mff.cuni.cz/)** — P2Rank
- **[Oxford Protein Informatics Group](https://opig.stats.ox.ac.uk/)** — ImmuneBuilder
- **[RDKit](https://www.rdkit.org/)** — molecular informatics
- **[ChEMBL](https://www.ebi.ac.uk/chembl/)** — bioactivity data
- **[UniProt](https://www.uniprot.org/)** — protein knowledge base
- **[PubChem](https://pubchem.ncbi.nlm.nih.gov/)** — compound images
- **[OpenTargets](https://platform.opentargets.org/)** — safety & tractability
- **[Anthropic](https://anthropic.com/)** — Claude AI
