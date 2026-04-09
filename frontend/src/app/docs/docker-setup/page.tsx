import Link from 'next/link';

export const metadata = { title: 'Docker Setup' };

export default function DockerSetupPage() {
  return (
    <>
      <h1>Docker setup</h1>

      <p>
        OpenDDE uses Docker Compose to orchestrate six containers. This page covers advanced
        configuration, troubleshooting, and production deployment.
      </p>

      <h2 id="services">Container overview</h2>

      <p>Running <code>docker compose up --build</code> starts:</p>

      <table>
        <thead>
          <tr><th>Container</th><th>Port</th><th>Health check</th></tr>
        </thead>
        <tbody>
          <tr><td>frontend</td><td>3000</td><td>HTTP GET /</td></tr>
          <tr><td>backend</td><td>8000</td><td>HTTP GET /api/v1/health</td></tr>
          <tr><td>p2rank</td><td>5001</td><td>HTTP GET /health</td></tr>
          <tr><td>rdkit</td><td>5002</td><td>HTTP GET /health</td></tr>
          <tr><td>immunebuilder</td><td>5003</td><td>HTTP GET /health</td></tr>
          <tr><td>redis</td><td>6379</td><td>redis-cli ping</td></tr>
        </tbody>
      </table>

      <h2 id="env">Environment variables</h2>

      <pre><code>{`# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...   # Optional: enables AI assistant
ALPHAFOLD_API_KEY=...          # Optional: for complex prediction`}</code></pre>

      <h2 id="production">Production deployment</h2>

      <p>
        Use the production compose file for deployment:
      </p>

      <pre><code>{`docker compose -f docker-compose.prod.yml up -d`}</code></pre>

      <p>Key differences in production:</p>

      <ul>
        <li>Gunicorn with 4 Uvicorn workers (instead of single-process uvicorn)</li>
        <li>No source code volume mounts</li>
        <li>Internal services (P2Rank, ImmuneBuilder, RDKit) have no exposed ports</li>
        <li><code>restart: unless-stopped</code> on all services</li>
      </ul>

      <h2 id="troubleshooting">Troubleshooting</h2>

      <h3>Containers won&rsquo;t start</h3>
      <pre><code>{`# Check Docker is running
docker info

# View container logs
docker compose logs backend
docker compose logs p2rank

# Rebuild from scratch
docker compose down -v
docker compose up --build`}</code></pre>

      <h3>Out of memory</h3>
      <p>
        Increase Docker Desktop memory allocation to at least 8 GB in{' '}
        <strong>Settings &rarr; Resources &rarr; Memory</strong>.
      </p>

      <h3>Port conflicts</h3>
      <p>
        If port 3000 or 8000 is already in use, modify the port mapping in{' '}
        <code>docker-compose.yml</code>:
      </p>

      <pre><code>{`ports:
  - "3001:3000"  # Map to different host port`}</code></pre>

      <p><Link href="/docs/quick-start">&larr; Back to Quick start</Link></p>
    </>
  );
}
