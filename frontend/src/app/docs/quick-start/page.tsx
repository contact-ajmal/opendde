import Link from 'next/link';

export const metadata = { title: 'Quick Start', description: 'Get OpenDDE running on your machine in under 5 minutes with Docker Compose.' };

export default function QuickStartPage() {
  return (
    <>
      <h1>Quick start guide</h1>

      <p>
        Get OpenDDE running on your local machine in under 5 minutes. All you need is Docker
        Desktop.
      </p>

      <h2 id="prerequisites">1. Prerequisites</h2>

      <p>Make sure you have the following installed:</p>

      <ul>
        <li>
          <strong>Docker Desktop</strong> (v4.0+) &mdash;{' '}
          <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">
            Download here
          </a>
        </li>
        <li><strong>Git</strong> &mdash; to clone the repository</li>
        <li><strong>8 GB RAM</strong> minimum (16 GB recommended)</li>
      </ul>

      <p>
        See <Link href="/docs/system-requirements">System requirements</Link> for full details.
      </p>

      <h2 id="clone">2. Clone the repository</h2>

      <pre><code>{`git clone https://github.com/your-org/opendde.git
cd opendde`}</code></pre>

      <h2 id="env">3. Set up environment variables</h2>

      <p>
        Copy the example environment file and add your API keys:
      </p>

      <pre><code>{`cp .env.example .env`}</code></pre>

      <p>Edit <code>.env</code> and set the required values:</p>

      <pre><code>{`# Required
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Optional (for AI assistant)
ANTHROPIC_API_KEY=your_anthropic_key

# Optional (for AlphaFold complex prediction)
ALPHAFOLD_API_KEY=your_alphafold_key`}</code></pre>

      <h2 id="build">4. Build and start all services</h2>

      <pre><code>{`docker compose up --build`}</code></pre>

      <p>
        This will build and start 6 containers: the Next.js frontend, FastAPI backend, P2Rank
        pocket predictor, ImmuneBuilder antibody modeler, RDKit cheminformatics service, and Redis
        cache.
      </p>

      <p>First build takes 5&ndash;10 minutes. Subsequent starts take ~30 seconds.</p>

      <h2 id="open">5. Open the app</h2>

      <p>
        Once all containers are healthy, open your browser to:
      </p>

      <pre><code>{`http://localhost:3000`}</code></pre>

      <h2 id="first-target">6. Search your first target</h2>

      <ol>
        <li>Click <strong>&ldquo;Launch app&rdquo;</strong> on the homepage</li>
        <li>Type a protein name or UniProt ID into the search bar (try <code>EGFR</code> or <code>P00533</code>)</li>
        <li>Wait for the target to resolve &mdash; you&rsquo;ll see the 3D structure load</li>
        <li>Binding pockets appear as colored spheres on the protein surface</li>
        <li>Click any pocket to explore its residues, known ligands, and druggability score</li>
      </ol>

      <h2 id="whats-next">What&rsquo;s next?</h2>

      <ul>
        <li><Link href="/docs/pocket-discovery">Learn about pocket discovery</Link></li>
        <li><Link href="/docs/ligand-intelligence">Explore ligand intelligence</Link></li>
        <li><Link href="/docs/architecture">Understand the architecture</Link></li>
      </ul>
    </>
  );
}
