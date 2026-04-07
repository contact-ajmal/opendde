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

Everything runs locally via Docker Compose — no cloud GPU required.

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/opendde.git && cd opendde
cp .env.example .env   # edit with your Supabase credentials
docker compose up --build
open http://localhost:3000
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐ │
│  │ Frontend │───▶│ Backend  │───▶│  P2Rank  │    │ Immune-   │ │
│  │ Next.js  │    │ FastAPI  │    │ Java+Py  │    │ Builder   │ │
│  │ :3000    │    │ :8000    │    │ :8001    │    │ :8002     │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └───────────┘ │
│                       │                                         │
│                  ┌────┴─────┐                                   │
│                  │  Redis   │                                   │
│                  │  :6379   │                                   │
│                  └──────────┘                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
    ┌──────────┐ ┌──────────┐  ┌───────────┐
    │ Supabase │ │ External │  │ External  │
    │ Postgres │ │   APIs   │  │   APIs    │
    │          │ │ UniProt  │  │  ChEMBL   │
    │          │ │ AlphaFold│  │  PubChem  │
    └──────────┘ └──────────┘  └───────────┘
```

### Request Flow

```
User search → Frontend → POST /api/v1/target/resolve → UniProt API
                        → POST /api/v1/pockets         → P2Rank service
                        → GET  /api/v1/ligands/{id}     → ChEMBL pipeline
                        → POST /api/v1/complex/prepare  → AF3 Server JSON
                        → POST /api/v1/antibody/predict  → ImmuneBuilder
```

All responses are cached in Supabase (7-day TTL) with Redis as a fast layer.

---

## Features

### Pocket Discovery — P2Rank
Machine-learning binding site prediction on protein structures. Identifies druggable pockets with scores, druggability estimates, and residue lists. Results visualized as colored highlights on the 3D structure.

### Ligand Intelligence — ChEMBL
Fetches known drugs and bioactive compounds for a target with IC₅₀, Ki, and Kd activity data. Includes clinical trial phase, 2D structure images from PubChem, and CSV export.

### Complex Prediction — AlphaFold 3 Server
Generates AF3-compatible input JSON for protein–ligand pairs. Semi-automated workflow: prepare → submit to AF3 Server → upload result → view predicted complex in 3D.

### Antibody Modeling — ImmuneBuilder
Predicts antibody 3D structures from VH/VL sequences using ABodyBuilder2. Identifies and visualizes all six CDR loops (Chothia numbering).

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
| **Engines** | LLM summarization | P2Rank, AF3, ImmuneBuilder |
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
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, 3Dmol.js |
| **Backend** | FastAPI, httpx, Pydantic, aiofiles |
| **Engines** | P2Rank 2.5.1 (Java), ImmuneBuilder/ABodyBuilder2, AF3 Server |
| **Data sources** | UniProt, AlphaFold DB, ChEMBL, PubChem |
| **Database** | Supabase (PostgreSQL) with 7-day TTL cache |
| **Cache** | Redis |
| **Infrastructure** | Docker Compose (5 containers, 3 volumes) |

---

## Roadmap

- [ ] **Boltz-2 cloud** — docking with predicted binding affinity
- [ ] **AutoDock Vina** — classical docking as a local engine option
- [ ] **Claude interpretation** — LLM-powered analysis of binding predictions
- [ ] **IsoDDE integration** — connect to Isomorphic Labs' platform when API available
- [ ] **Batch mode** — screen compound libraries against a target
- [ ] **Protein–protein docking** — extend AF3 workflow to protein complexes

---

## Project Structure

```
opendde/
├── frontend/                # Next.js 14 app
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       └── lib/             # API helpers, types
├── backend/                 # FastAPI server
│   ├── routers/             # API route handlers
│   ├── services/            # External API integrations
│   ├── engines/             # Prediction engine wrappers
│   └── models/              # Pydantic schemas
├── services/
│   ├── p2rank/              # P2Rank microservice
│   └── immunebuilder/       # ImmuneBuilder microservice
├── docker-compose.yml
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
- **[ChEMBL](https://www.ebi.ac.uk/chembl/)** — bioactivity data
- **[UniProt](https://www.uniprot.org/)** — protein knowledge base
- **[PubChem](https://pubchem.ncbi.nlm.nih.gov/)** — compound images
