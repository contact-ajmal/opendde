import Link from 'next/link';

export const metadata = {
  title: 'How OpenDDE Works',
  description: 'Technical overview of OpenDDE features: pocket discovery, ligand intelligence, complex prediction, and AI assistant.',
};

export default function HowOpenDDEWorksPage() {
  return (
    <>
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          Platform
        </span>
        <h1 id="top">How OpenDDE works</h1>
        <p className="lead">
          A technical but accessible overview of every feature in the platform. Understand what
          each tool does, how it works, and why it matters for drug design.
        </p>
      </header>

      {/* ── Pocket discovery ───────────────────────────────── */}
      <h2 id="pocket-discovery">Pocket discovery</h2>

      <p>
        When you search for a protein in OpenDDE, the first thing you see is its 3D structure with
        colored spheres highlighting <strong>predicted binding pockets</strong>. These are the
        regions where a drug molecule could potentially bind.
      </p>

      <h3 id="what-p2rank-does">What P2Rank does</h3>
      <p>
        <strong>P2Rank</strong> is a machine-learning tool that predicts ligand-binding sites
        directly from a protein&rsquo;s 3D structure. It works in four steps:
      </p>
      <ol>
        <li><strong>Surface sampling</strong> &mdash; The protein surface is represented as thousands of points</li>
        <li><strong>Feature extraction</strong> &mdash; Each point gets chemical and geometric features (hydrophobicity, curvature, charge, atom density)</li>
        <li><strong>ML scoring</strong> &mdash; A random forest model scores each point&rsquo;s likelihood of being part of a binding site</li>
        <li><strong>Clustering</strong> &mdash; High-scoring points are grouped into discrete pockets, ranked by aggregate score</li>
      </ol>

      <h3 id="druggability-meaning">What druggability means</h3>
      <p>
        Each pocket receives a druggability score from 0 to 1. This reflects how likely the pocket
        is to bind a small drug molecule:
      </p>
      <ul>
        <li><strong>0.8&ndash;1.0</strong> &mdash; Highly druggable. Deep, enclosed, hydrophobic cavity.</li>
        <li><strong>0.5&ndash;0.8</strong> &mdash; Moderately druggable. Reasonable but may be shallow.</li>
        <li><strong>Below 0.5</strong> &mdash; Challenging. Flat, exposed, or too polar.</li>
      </ul>

      <p>
        OpenDDE also shows the <strong>residue composition</strong> of each pocket &mdash; the
        mix of hydrophobic, polar, charged, and aromatic amino acids that line the cavity. This
        composition hints at what kind of drug molecule would fit best.
      </p>

      {/* ── Ligand intelligence ────────────────────────────── */}
      <h2 id="ligand-intelligence">Ligand intelligence</h2>

      <p>
        For any protein target, OpenDDE pulls all known bioactive compounds from{' '}
        <strong>ChEMBL</strong>, the world&rsquo;s largest open-access database of drug-like
        molecules with experimental binding data.
      </p>

      <h3 id="activity-data">How activity data is measured</h3>
      <p>
        In a lab, scientists mix a compound with a protein and measure how strongly it binds. The
        result is typically an <strong>IC50</strong> (concentration needed to inhibit 50% of the
        target&rsquo;s activity) or <strong>Ki</strong> (binding affinity constant). Both are
        measured in nanomolar (nM):
      </p>
      <ul>
        <li><strong>&lt; 100 nM</strong> &mdash; Very potent. Drug candidate territory.</li>
        <li><strong>100&ndash;1,000 nM</strong> &mdash; Moderate. Useful as a lead for optimization.</li>
        <li><strong>&gt; 10,000 nM</strong> &mdash; Weak binder. Probably not useful as-is.</li>
      </ul>

      <h3 id="clinical-phases">Clinical phases</h3>
      <p>
        Some compounds in ChEMBL have reached clinical trials. OpenDDE displays the development
        stage (Phase I through IV, or Approved) so you can quickly see which compounds have
        real-world validation.
      </p>

      <h3 id="sar-and-cliffs">SAR and activity cliffs</h3>
      <p>
        The SAR scatter plot visualizes all compounds on a molecular weight vs. activity chart.
        <strong>Activity cliffs</strong> &mdash; pairs of compounds that are structurally similar
        but have very different activities &mdash; are automatically detected and highlighted.
        These cliffs reveal which small molecular changes have outsized effects on potency.
      </p>

      {/* ── Complex prediction ─────────────────────────────── */}
      <h2 id="complex-prediction">Complex prediction</h2>

      <p>
        Once you know a protein&rsquo;s pockets and its known ligands, the next question is:
        <em>how exactly does a drug molecule sit in the pocket?</em> This 3D arrangement is
        called a <strong>binding pose</strong>.
      </p>

      <h3 id="alphafold3">AlphaFold 3</h3>
      <p>
        <strong>AlphaFold 3</strong> uses a diffusion-based deep learning architecture to predict
        protein-ligand complexes. Unlike traditional docking (which uses physics-based scoring),
        AlphaFold 3 learns from millions of experimentally determined structures.
      </p>
      <p>
        The process: starting from random atom positions, the model iteratively refines the 3D
        coordinates through a denoising process (similar to image generation models, but in 3D
        molecular space).
      </p>

      <h3 id="confidence">Confidence metrics</h3>
      <ul>
        <li><strong>iPTM</strong> (0&ndash;1) &mdash; Interface confidence. Above 0.8 is reliable.</li>
        <li><strong>pLDDT</strong> (0&ndash;100) &mdash; Per-residue confidence. Above 70 is good.</li>
      </ul>

      <div className="callout callout-amber">
        <div className="callout-title">Semi-automated workflow</div>
        <p>
          OpenDDE generates the AlphaFold 3 job file for you and handles the upload. You
          currently need to submit the job through the AlphaFold Server web interface manually.
          As API access becomes available, this step will be fully automated.
        </p>
      </div>

      {/* ── AI assistant ───────────────────────────────────── */}
      <h2 id="ai-assistant">AI assistant</h2>

      <p>
        OpenDDE includes a <strong>Claude-powered AI assistant</strong> that provides expert
        interpretation of your results. The assistant has full context about the current target,
        its pockets, and known ligands.
      </p>

      <p>It can:</p>
      <ul>
        <li>Explain why a pocket is or isn&rsquo;t druggable</li>
        <li>Suggest chemical modifications to improve a compound</li>
        <li>Provide background on a protein&rsquo;s biological role and disease associations</li>
        <li>Help interpret confidence scores and activity data</li>
      </ul>

      <p>
        Two automatic analyses are cached per pocket: a druggability summary and suggested
        ligand modifications tailored to the pocket&rsquo;s chemical environment.
      </p>

      {/* ── Architecture ───────────────────────────────────── */}
      <h2 id="architecture">Architecture</h2>

      <p>
        OpenDDE is a <strong>Docker Compose</strong> application with six containers:
      </p>

      <div className="my-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <pre className="text-xs leading-relaxed" style={{ fontFamily: 'monospace' }}><code>{`  Browser (localhost:3000)
      │
      ▼
┌──────────────┐     ┌───────────────────────────────┐
│   Frontend   │────▶│         Backend (FastAPI)       │
│   Next.js    │     │                                 │
└──────────────┘     │  ┌─────────┐ ┌──────┐ ┌─────┐ │
                     │  │ P2Rank  │ │ RDKit│ │Immun│ │
                     │  │  :5001  │ │:5002 │ │:5003│ │
                     │  └─────────┘ └──────┘ └─────┘ │
                     │       ▲                         │
                     │  Redis cache    Supabase (ext.) │
                     └───────────────────────────────┘
                          │
                     External APIs:
                     ChEMBL, UniProt, AlphaFold DB, Claude`}</code></pre>
      </div>

      <p>
        Every computational engine can be swapped without changing the rest of the system. P2Rank
        could become FPocket, AlphaFold could become Boltz-2, ImmuneBuilder could become
        ABodyBuilder3 &mdash; all through a standardized adapter interface.
      </p>

      <p>
        For the full technical deep dive, see the{' '}
        <Link href="/docs/architecture">Architecture documentation</Link>.
      </p>

      <hr />

      <p>
        <strong>Want to see it in action?</strong> Read the{' '}
        <Link href="/learn/target-to-drug">From target to drug</Link> walkthrough, which uses
        a real cancer drug target as an example.
      </p>
    </>
  );
}
