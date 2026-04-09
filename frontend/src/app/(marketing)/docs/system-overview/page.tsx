import Link from 'next/link';

export const metadata = { title: 'System Overview', description: 'Request lifecycle and external dependencies.' };

export default function SystemOverviewPage() {
  return (
    <>
      <h1>System overview</h1>

      <p>
        OpenDDE follows a hub-and-spoke architecture. The <strong>FastAPI backend</strong> acts as
        the hub, orchestrating requests between the frontend, three computational microservices,
        a cache layer, and external APIs.
      </p>

      <h2 id="request-lifecycle">Request lifecycle</h2>

      <p>Every user action follows this path:</p>

      <ol>
        <li><strong>Frontend</strong> (Next.js) makes an API call to the backend</li>
        <li><strong>Backend</strong> checks the in-memory cache (1h TTL, 200 max entries)</li>
        <li>On cache miss, the backend routes to the appropriate service:
          <ul>
            <li>P2Rank for pocket prediction</li>
            <li>RDKit for molecular properties</li>
            <li>ImmuneBuilder for antibody structures</li>
            <li>External APIs (ChEMBL, UniProt, AlphaFold DB) for data</li>
          </ul>
        </li>
        <li><strong>Backend</strong> stores results in Supabase (PostgreSQL) for persistence</li>
        <li><strong>Backend</strong> caches the response and returns it to the frontend</li>
      </ol>

      <h2 id="internal-communication">Internal communication</h2>

      <p>
        All inter-service communication uses HTTP/REST over the Docker Compose internal network.
        Services reference each other by container name (e.g., <code>http://p2rank:5001</code>).
      </p>

      <h2 id="external-dependencies">External dependencies</h2>

      <table>
        <thead>
          <tr><th>Service</th><th>Used for</th><th>Required?</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Persistent storage</td><td>Yes</td></tr>
          <tr><td>UniProt API</td><td>Protein data &amp; sequences</td><td>Yes</td></tr>
          <tr><td>AlphaFold DB</td><td>Predicted structures</td><td>Yes</td></tr>
          <tr><td>ChEMBL API</td><td>Ligand bioactivity data</td><td>Yes</td></tr>
          <tr><td>Anthropic API</td><td>AI assistant</td><td>Optional</td></tr>
          <tr><td>Open Targets</td><td>Safety profiles</td><td>Optional</td></tr>
        </tbody>
      </table>

      <p><Link href="/docs/engine-swap">Next: Engine swap layer &rarr;</Link></p>
    </>
  );
}
