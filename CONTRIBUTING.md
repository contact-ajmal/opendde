# Contributing to OpenDDE

Thank you for your interest in contributing to OpenDDE! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Adding New Engines](#adding-new-engines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Be respectful, constructive, and collaborative. We're building tools to help researchers find new treatments — let's keep the focus on that shared mission.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/opendde.git
   cd opendde
   ```
3. **Create a branch** for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

### Prerequisites

- Docker Desktop 4.0+
- Node.js 18+ (for frontend development outside Docker)
- Python 3.11+ (for backend development outside Docker)
- Git

---

## Development Setup

### Running with Docker (recommended)

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your Supabase credentials

# Start all services with hot reload
docker compose up --build
```

This starts 6 containers with live reload:
- **Frontend** (Next.js): http://localhost:3000 — Fast Refresh on file save
- **Backend** (FastAPI): http://localhost:8000 — Uvicorn auto-reload
- **P2Rank**: http://localhost:5001
- **RDKit**: http://localhost:5002
- **ImmuneBuilder**: http://localhost:5003
- **Redis**: localhost:6379

### Running frontend standalone

If you're only working on the frontend and the backend is already running:

```bash
cd frontend
npm install
npm run dev
```

### Running backend standalone

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Project Structure

```
opendde/
├── frontend/                 # Next.js 14 application
│   └── src/
│       ├── app/              # Pages and routes
│       │   ├── page.tsx      # Marketing homepage
│       │   ├── docs/         # Documentation site (21 pages)
│       │   ├── learn/        # Educational articles (5 pages)
│       │   └── app/          # Main application
│       │       ├── dashboard/
│       │       ├── target/[uniprotId]/
│       │       ├── antibody/
│       │       └── analytics/
│       ├── components/       # Reusable UI components
│       └── lib/              # Utilities (API client, etc.)
│
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App setup, middleware, router registration
│   └── routers/              # 15 router modules, 35 endpoints
│
├── services/                 # Computational microservices
│   ├── p2rank/               # Pocket prediction
│   ├── rdkit/                # Cheminformatics
│   └── immunebuilder/        # Antibody modeling
│
├── docker-compose.yml        # Development orchestration
├── docker-compose.prod.yml   # Production orchestration
└── .env.example              # Environment template
```

---

## Making Changes

### Branch naming

Use descriptive prefixes:

```
feat/pocket-comparison-view
fix/ligand-table-sorting
docs/api-reference-update
refactor/engine-adapter-pattern
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add pocket comparison radar chart
fix: correct ligand table sorting by activity value
docs: update API reference with export endpoints
refactor: extract engine adapter base class
```

### Code style

- **Frontend**: Follow existing patterns. Use TypeScript. Tailwind CSS for styling.
- **Backend**: Follow PEP 8. Use type hints. Async where possible.
- **Components**: One component per file. Props interface at the top.

### What to avoid

- Don't commit `.env` files or API keys
- Don't add unnecessary dependencies
- Don't change unrelated code in a PR
- Don't break existing tests or API contracts

---

## Adding New Engines

OpenDDE's modular architecture makes it straightforward to add new computational engines. Here's the process:

### 1. Create the Docker service

```bash
mkdir services/my-engine
```

Write a minimal HTTP wrapper:

```python
# services/my-engine/app.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/predict', methods=['POST'])
def predict():
    # Your prediction logic here
    return jsonify({"result": ...})
```

### 2. Implement the adapter

```python
# backend/engines/my_engine.py
from .base import PocketEngine  # or StructureEngine, AntibodyEngine

class MyEngine(PocketEngine):
    def __init__(self, base_url: str = "http://my-engine:5004"):
        self.base_url = base_url

    async def predict(self, structure_path: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base_url}/predict", ...)
            return self._parse(resp.json())
```

### 3. Add to Docker Compose

```yaml
services:
  my-engine:
    build: ./services/my-engine
    ports:
      - "5004:5004"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 4. Update backend configuration

Wire the new engine into the dependency injection system.

---

## Pull Request Process

1. **Ensure your code builds**: `docker compose up --build` succeeds
2. **Test your changes**: Verify affected pages load correctly
3. **Write a clear PR description**: What changed and why
4. **Keep PRs focused**: One feature or fix per PR
5. **Update docs if needed**: API changes → update API reference

### PR template

```markdown
## Summary
- What this PR does (1-3 bullet points)

## Test plan
- [ ] Tested on desktop (1440px)
- [ ] Tested on mobile (375px)
- [ ] All affected pages load correctly
- [ ] No console errors

## Screenshots
(if UI changes)
```

### Review process

1. Submit your PR
2. A maintainer will review within 48 hours
3. Address feedback and push additional commits
4. Once approved, the PR will be squash-merged into main

---

## Reporting Issues

When reporting a bug:

1. **Search existing issues** first
2. Include: steps to reproduce, expected vs. actual behavior, browser/OS
3. Include Docker logs if relevant: `docker compose logs backend`
4. For UI bugs, include a screenshot

For feature requests, explain the use case and why it would help drug design research.

---

## Areas Where Help Is Needed

- **New engines**: Boltz-2, AutoDock Vina, FPocket integration
- **Testing**: Unit tests for backend routers, component tests for frontend
- **Visualization**: New chart types, improved 3D viewer features
- **Documentation**: Tutorials, video guides, API examples
- **Accessibility**: Keyboard navigation, screen reader support
- **Performance**: Bundle optimization, lazy loading improvements
- **i18n**: Internationalization for non-English researchers

Thank you for contributing to open-source drug design!
