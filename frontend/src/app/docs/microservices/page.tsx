import Link from 'next/link';

export const metadata = { title: 'Microservices', description: 'P2Rank, RDKit, and ImmuneBuilder service details.' };

export default function MicroservicesPage() {
  return (
    <>
      <h1>Microservices</h1>

      <p>
        OpenDDE runs three computational microservices alongside the main backend. Each is a
        lightweight HTTP server wrapping a specialized tool.
      </p>

      <h2 id="p2rank">P2Rank service</h2>

      <table>
        <tbody>
          <tr><td><strong>Port</strong></td><td>5001</td></tr>
          <tr><td><strong>Technology</strong></td><td>Java (P2Rank) + Python Flask wrapper</td></tr>
          <tr><td><strong>Docker image</strong></td><td>~1.2 GB</td></tr>
        </tbody>
      </table>

      <p>
        P2Rank is a machine-learning tool for predicting ligand-binding sites. The service accepts
        a protein structure file (CIF/PDB) and returns ranked pockets with scores and residue lists.
      </p>

      <pre><code>{`# Internal API
POST http://p2rank:5001/predict
Content-Type: multipart/form-data
Body: structure=@protein.cif`}</code></pre>

      <h2 id="rdkit">RDKit service</h2>

      <table>
        <tbody>
          <tr><td><strong>Port</strong></td><td>5002</td></tr>
          <tr><td><strong>Technology</strong></td><td>Python + RDKit + Flask</td></tr>
          <tr><td><strong>Docker image</strong></td><td>~800 MB</td></tr>
        </tbody>
      </table>

      <p>
        Handles all cheminformatics: molecular property calculation, SMILES validation, 2D
        depiction, fingerprint computation, and similarity calculations.
      </p>

      <h2 id="immunebuilder">ImmuneBuilder service</h2>

      <table>
        <tbody>
          <tr><td><strong>Port</strong></td><td>5003</td></tr>
          <tr><td><strong>Technology</strong></td><td>Python + PyTorch + ImmuneBuilder</td></tr>
          <tr><td><strong>Docker image</strong></td><td>~2 GB (includes PyTorch)</td></tr>
        </tbody>
      </table>

      <p>
        Predicts antibody 3D structures from amino acid sequences. Includes CDR loop annotation
        and confidence scoring.
      </p>

      <h2 id="health-checks">Health checks</h2>

      <p>All services expose a <code>GET /health</code> endpoint. Docker Compose uses these to
        ensure services are ready before accepting requests:</p>

      <pre><code>{`healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
  interval: 30s
  timeout: 10s
  retries: 3`}</code></pre>

      <p><Link href="/docs/database-schema">Next: Database schema &rarr;</Link></p>
    </>
  );
}
