import Link from 'next/link';

export const metadata = {
  title: 'Understanding Proteins',
  description: 'A visual guide to protein structure — from amino acid sequence to 3D fold. Learn what AlphaFold pLDDT scores mean.',
};

export default function UnderstandingProteinsPage() {
  return (
    <>
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          Biology
        </span>
        <h1 id="top">Understanding proteins</h1>
        <p className="lead">
          A visual guide to protein structure &mdash; from amino acid chains to 3D molecular
          machines. This is the foundation for understanding everything else in drug design.
        </p>
      </header>

      {/* ── What are proteins ──────────────────────────────── */}
      <h2 id="what-are-proteins">What are proteins?</h2>

      <p>
        Proteins are the workhorses of biology. They catalyze chemical reactions, transmit signals,
        transport molecules, provide structural support, and defend against pathogens. Almost every
        process in a living cell depends on proteins.
      </p>

      <p>
        A protein is built from a chain of <strong>amino acids</strong> &mdash; small organic
        molecules linked together like beads on a string. There are 20 standard amino acids, each
        with a different chemical character (some are oily, some are charged, some can form hydrogen
        bonds). The specific sequence of amino acids is called the protein&rsquo;s{' '}
        <strong>primary structure</strong>.
      </p>

      <div className="callout">
        <div className="callout-title">Scale</div>
        <p>
          A typical protein is 300&ndash;500 amino acids long. The largest human protein (titin)
          has over 34,000 amino acids. Proteins are measured in <strong>Daltons (Da)</strong>;
          a typical drug target is 30,000&ndash;100,000 Da, while drug molecules are under 500 Da.
        </p>
      </div>

      {/* ── Levels of structure ────────────────────────────── */}
      <h2 id="levels-of-structure">The four levels of protein structure</h2>

      <h3 id="primary">Primary structure: the sequence</h3>
      <p>
        The linear chain of amino acids, read from left to right. Written in single-letter code:
      </p>
      <pre><code>{`MTEYKLVVVGAVGVGKSALTIQLIQNHFVDEYDPTIEDSY...`}</code></pre>
      <p>
        This is the &ldquo;source code&rdquo; of the protein. Everything else follows from this
        sequence.
      </p>

      <h3 id="secondary">Secondary structure: local patterns</h3>
      <p>
        The amino acid chain folds into local patterns held together by hydrogen bonds:
      </p>
      <ul>
        <li>
          <strong>Alpha helices (&alpha;)</strong> &mdash; Coiled ribbons, like a spiral staircase.
          Common in membrane proteins and structural proteins.
        </li>
        <li>
          <strong>Beta sheets (&beta;)</strong> &mdash; Flat, pleated structures where the chain
          zigzags back and forth. Common in antibodies and enzymes.
        </li>
        <li>
          <strong>Loops</strong> &mdash; Irregular connecting regions. Often found at the protein
          surface and important for binding.
        </li>
      </ul>

      <h3 id="tertiary">Tertiary structure: the 3D fold</h3>
      <p>
        The complete 3D arrangement of the protein chain. Secondary structure elements pack together,
        driven by:
      </p>
      <ul>
        <li><strong>Hydrophobic collapse</strong> &mdash; Oily amino acids bury themselves in the protein&rsquo;s interior, away from water</li>
        <li><strong>Hydrogen bonds</strong> &mdash; Polar amino acids form specific pairwise interactions</li>
        <li><strong>Salt bridges</strong> &mdash; Positively and negatively charged amino acids attract</li>
        <li><strong>Disulfide bonds</strong> &mdash; Covalent bridges between cysteine residues</li>
      </ul>
      <p>
        This 3D shape determines the protein&rsquo;s function. <strong>Binding pockets</strong>{' '}
        are cavities on the surface of this folded structure.
      </p>

      <h3 id="quaternary">Quaternary structure: complexes</h3>
      <p>
        Many proteins function as multi-chain complexes. Hemoglobin, for example, consists of four
        protein chains working together. Antibodies are dimers of two heavy chains and two light
        chains. Understanding quaternary structure is important for predicting how drugs interact
        at protein-protein interfaces.
      </p>

      {/* ── AlphaFold ──────────────────────────────────────── */}
      <h2 id="alphafold">How AlphaFold predicts structure</h2>

      <p>
        For decades, determining a protein&rsquo;s 3D structure required expensive and time-consuming
        experiments: X-ray crystallography (months to years per structure), NMR spectroscopy, or
        cryo-electron microscopy. In 2020, <strong>AlphaFold</strong> changed everything.
      </p>

      <p>
        AlphaFold is a deep learning model developed by DeepMind. Given only a protein&rsquo;s
        amino acid sequence, it predicts the complete 3D structure with near-experimental accuracy.
        The key innovations:
      </p>

      <ol>
        <li>
          <strong>Multiple sequence alignment (MSA)</strong> &mdash; AlphaFold looks at the same
          protein across hundreds of species. Amino acids that change together (co-evolve) are
          likely in physical contact in the 3D structure.
        </li>
        <li>
          <strong>Attention mechanism</strong> &mdash; A transformer architecture reasons about
          all pairwise distances between amino acids simultaneously.
        </li>
        <li>
          <strong>Structure module</strong> &mdash; Iteratively refines 3D coordinates from the
          pairwise representations.
        </li>
      </ol>

      <p>
        The <strong>AlphaFold Database</strong> now contains predicted structures for over 200
        million proteins &mdash; essentially every known protein sequence. OpenDDE downloads
        structures from this database when you search for a target.
      </p>

      {/* ── pLDDT ──────────────────────────────────────────── */}
      <h2 id="plddt">What pLDDT confidence means</h2>

      <p>
        Every AlphaFold prediction comes with a confidence score for each amino acid position,
        called <strong>pLDDT</strong> (predicted Local Distance Difference Test):
      </p>

      <table>
        <thead>
          <tr><th>pLDDT</th><th>Color</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>90&ndash;100</strong></td>
            <td style={{ color: '#1e88e5' }}>Blue</td>
            <td>Very high confidence. Backbone and side chains are reliable.</td>
          </tr>
          <tr>
            <td><strong>70&ndash;90</strong></td>
            <td style={{ color: '#43a047' }}>Green</td>
            <td>High confidence. Backbone is reliable; some side chain uncertainty.</td>
          </tr>
          <tr>
            <td><strong>50&ndash;70</strong></td>
            <td style={{ color: '#fdd835' }}>Yellow</td>
            <td>Low confidence. Treat as approximate.</td>
          </tr>
          <tr>
            <td><strong>Below 50</strong></td>
            <td style={{ color: '#e53935' }}>Red</td>
            <td>Very low confidence. Often disordered regions or flexible loops. Do not use for drug design.</td>
          </tr>
        </tbody>
      </table>

      <div className="callout callout-amber">
        <div className="callout-title">Important for drug design</div>
        <p>
          If a binding pocket falls in a low-confidence region (yellow/red pLDDT), pocket
          predictions there are unreliable. Always check the pLDDT of the pocket residues
          before making drug design decisions.
        </p>
      </div>

      {/* ── Relevance to drug design ──────────────────────── */}
      <h2 id="relevance">Why structure matters for drugs</h2>

      <p>
        Knowing a protein&rsquo;s 3D structure enables:
      </p>

      <ul>
        <li><strong>Pocket identification</strong> &mdash; Find where drugs can bind</li>
        <li><strong>Structure-based drug design</strong> &mdash; Design molecules that fit specific pockets</li>
        <li><strong>Selectivity engineering</strong> &mdash; Ensure drugs bind only the target protein, not similar ones</li>
        <li><strong>Resistance prediction</strong> &mdash; Understand how mutations might reduce drug effectiveness</li>
      </ul>

      <p>
        Without structure, drug design is like trying to pick a lock blindfolded. With AlphaFold
        providing structures for virtually every protein, computational drug design is now
        possible for targets that previously had no structural information.
      </p>

      <hr />

      <p>
        <strong>See it in practice:</strong> The{' '}
        <Link href="/learn/target-to-drug">From target to drug</Link> walkthrough shows how
        structure enables drug discovery for a real cancer target.
      </p>
    </>
  );
}
