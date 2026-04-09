import Link from 'next/link';

export const metadata = { title: 'System Requirements' };

export default function SystemRequirementsPage() {
  return (
    <>
      <h1>System requirements</h1>

      <p>
        OpenDDE runs entirely in Docker containers on your local machine. Here&rsquo;s what you
        need.
      </p>

      <h2 id="minimum">Minimum requirements</h2>

      <table>
        <thead>
          <tr><th>Component</th><th>Minimum</th><th>Recommended</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>RAM</strong></td><td>8 GB</td><td>16 GB</td></tr>
          <tr><td><strong>CPU</strong></td><td>4 cores</td><td>8+ cores</td></tr>
          <tr><td><strong>Disk</strong></td><td>10 GB free</td><td>20 GB free</td></tr>
          <tr><td><strong>Docker</strong></td><td>Docker Desktop 4.0+</td><td>Latest version</td></tr>
        </tbody>
      </table>

      <h2 id="os">Supported operating systems</h2>

      <ul>
        <li><strong>macOS</strong> 12+ (Intel &amp; Apple Silicon)</li>
        <li><strong>Linux</strong> (Ubuntu 20.04+, Debian 11+, Fedora 36+)</li>
        <li><strong>Windows</strong> 10/11 with WSL2 + Docker Desktop</li>
      </ul>

      <h2 id="network">Network requirements</h2>

      <p>
        The first run downloads Docker images and data (~5 GB). After that, OpenDDE needs internet
        access for:
      </p>

      <ul>
        <li>UniProt API (fetching protein data)</li>
        <li>ChEMBL API (fetching ligand data)</li>
        <li>AlphaFold Database (downloading structures)</li>
        <li>Anthropic API (AI assistant, optional)</li>
      </ul>

      <p>
        All computational engines (P2Rank, RDKit, ImmuneBuilder) run locally &mdash; no cloud GPU
        required.
      </p>

      <p><Link href="/docs/docker-setup">Next: Docker setup &rarr;</Link></p>
    </>
  );
}
