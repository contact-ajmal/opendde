import Link from 'next/link';

export const metadata = { title: 'System Architecture' };

export default function ArchitecturePage() {
  return (
    <>
      <h1>System architecture</h1>

      <p>
        OpenDDE is a microservices platform orchestrated by Docker Compose. Six containers work
        together to provide a complete computational drug design workflow.
      </p>

      <h2 id="system-diagram">System diagram</h2>

      <div className="my-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <pre className="text-xs leading-relaxed text-muted"><code>{`┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Frontend  │───▶│ Backend  │───▶│  Microservices   │  │
│  │ Next.js   │    │ FastAPI  │    │                  │  │
│  │ :3000     │    │ :8000    │    │  P2Rank  :5001   │  │
│  └──────────┘    │          │    │  RDKit   :5002   │  │
│                  │          │───▶│  Immune  :5003   │  │
│                  │          │    │                  │  │
│                  │          │    └──────────────────┘  │
│                  │          │                           │
│                  │          │───▶ Redis :6379           │
│                  │          │───▶ Supabase (external)   │
│                  │          │───▶ ChEMBL API (external) │
│                  │          │───▶ UniProt API (external) │
│                  │          │───▶ Claude API (external)  │
│                  └──────────┘                           │
└─────────────────────────────────────────────────────────┘`}</code></pre>
      </div>

      <h2 id="services">Services</h2>

      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Port</th>
            <th>Technology</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>frontend</strong></td>
            <td>3000</td>
            <td>Next.js 14</td>
            <td>React UI with App Router</td>
          </tr>
          <tr>
            <td><strong>backend</strong></td>
            <td>8000</td>
            <td>FastAPI + Python</td>
            <td>REST API, orchestration, caching</td>
          </tr>
          <tr>
            <td><strong>p2rank</strong></td>
            <td>5001</td>
            <td>Java + Flask wrapper</td>
            <td>ML pocket prediction</td>
          </tr>
          <tr>
            <td><strong>rdkit</strong></td>
            <td>5002</td>
            <td>Python + RDKit</td>
            <td>Molecular properties, depiction, similarity</td>
          </tr>
          <tr>
            <td><strong>immunebuilder</strong></td>
            <td>5003</td>
            <td>Python + PyTorch</td>
            <td>Antibody structure prediction</td>
          </tr>
          <tr>
            <td><strong>redis</strong></td>
            <td>6379</td>
            <td>Redis 7</td>
            <td>Response caching, session data</td>
          </tr>
        </tbody>
      </table>

      <h2 id="data-flow">Data flow</h2>

      <p>
        Here&rsquo;s what happens when you search for a protein target:
      </p>

      <ol>
        <li>
          <strong>Frontend</strong> sends <code>POST /api/v1/target/resolve</code> with the
          UniProt ID or gene name.
        </li>
        <li>
          <strong>Backend</strong> checks Supabase for a cached target. If not found, it queries
          the UniProt API and downloads the AlphaFold structure (CIF file).
        </li>
        <li>
          <strong>Backend</strong> sends the CIF file to the <strong>P2Rank</strong> service,
          which returns predicted binding pockets.
        </li>
        <li>
          <strong>Backend</strong> queries <strong>ChEMBL</strong> for known ligands targeting
          this protein.
        </li>
        <li>
          <strong>Backend</strong> stores everything in Supabase and returns the full target
          payload to the frontend.
        </li>
        <li>
          <strong>Frontend</strong> renders the 3D structure, pocket list, and ligand table.
        </li>
      </ol>

      <h2 id="engine-swap">Engine swap layer</h2>

      <p>
        OpenDDE is designed so that any computational engine can be replaced without changing the
        rest of the system. Each engine is accessed through a standardized adapter interface:
      </p>

      <pre><code>{`# backend/engines/pocket_engine.py
class PocketEngine:
    """Abstract interface for pocket prediction engines."""

    async def predict(self, structure_path: str) -> list[Pocket]:
        raise NotImplementedError

class P2RankEngine(PocketEngine):
    """P2Rank implementation."""

    async def predict(self, structure_path: str) -> list[Pocket]:
        response = await httpx.post(
            f"{self.base_url}/predict",
            files={"structure": open(structure_path, "rb")}
        )
        return self._parse_response(response.json())

# Future: swap in a different engine
class FPocketEngine(PocketEngine):
    """Alternative pocket predictor."""
    ...`}</code></pre>

      <p>
        This modular design means you could swap P2Rank for FPocket, AlphaFold for Boltz-2,
        or ImmuneBuilder for ABodyBuilder3 &mdash; all by implementing a single adapter class.
        See <Link href="/docs/engine-swap">Engine swap layer</Link> for details.
      </p>

      <h2 id="caching">Caching strategy</h2>

      <p>OpenDDE uses two layers of caching:</p>

      <ul>
        <li>
          <strong>In-memory response cache</strong> &mdash; GET requests to <code>/api/v1/*</code>{' '}
          are cached in memory for 1 hour (max 200 entries). Returns{' '}
          <code>x-cache: HIT</code> or <code>x-cache: MISS</code> headers.
        </li>
        <li>
          <strong>Structure file caching</strong> &mdash; CIF files are served with{' '}
          <code>Cache-Control: public, max-age=86400</code> (24 hours).
        </li>
      </ul>

      <h2 id="learn-more">Learn more</h2>

      <ul>
        <li><Link href="/docs/system-overview">System overview</Link></li>
        <li><Link href="/docs/microservices">Microservices deep dive</Link></li>
        <li><Link href="/docs/database-schema">Database schema</Link></li>
        <li><Link href="/docs/api-reference">API reference</Link></li>
      </ul>
    </>
  );
}
