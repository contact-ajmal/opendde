import Link from 'next/link';

export const metadata = { title: 'Antibody Modeling' };

export default function AntibodyModelingPage() {
  return (
    <>
      <h1>Antibody modeling</h1>

      <p>
        OpenDDE includes antibody structure prediction powered by{' '}
        <strong>ImmuneBuilder</strong>, developed at the Oxford Protein Informatics Group. Given
        heavy and light chain amino acid sequences, it predicts the full 3D structure with
        annotated CDR loops.
      </p>

      <h2 id="what-are-antibodies">What are antibodies?</h2>

      <p>
        Antibodies are Y-shaped proteins produced by the immune system. They bind to specific
        molecular targets (antigens) with extraordinary specificity. This makes them powerful
        therapeutics &mdash; antibody drugs represent over half of the top-selling drugs worldwide.
      </p>

      <p>An antibody consists of:</p>

      <ul>
        <li><strong>Heavy chain</strong> &mdash; The longer polypeptide chain</li>
        <li><strong>Light chain</strong> &mdash; The shorter polypeptide chain</li>
        <li><strong>CDR loops</strong> (Complementarity-Determining Regions) &mdash; Six hypervariable
          loops (3 on each chain) that form the antigen-binding site</li>
      </ul>

      <h2 id="how-it-works">How ImmuneBuilder works</h2>

      <ol>
        <li><strong>Input</strong> &mdash; Paste the heavy and light chain amino acid sequences</li>
        <li><strong>Prediction</strong> &mdash; ImmuneBuilder uses a deep learning model trained
          on thousands of experimental antibody structures</li>
        <li><strong>Output</strong> &mdash; A PDB file with the predicted 3D structure, including
          annotated CDR loops (H1, H2, H3, L1, L2, L3)</li>
      </ol>

      <h2 id="cdr-loops">Understanding CDR loops</h2>

      <p>
        The CDR loops are the &ldquo;business end&rdquo; of an antibody. They determine what the
        antibody binds to. The six CDR loops are named:
      </p>

      <table>
        <thead>
          <tr><th>CDR</th><th>Chain</th><th>Variability</th></tr>
        </thead>
        <tbody>
          <tr><td>H1</td><td>Heavy</td><td>Moderate</td></tr>
          <tr><td>H2</td><td>Heavy</td><td>Moderate</td></tr>
          <tr><td>H3</td><td>Heavy</td><td>Very high (hardest to predict)</td></tr>
          <tr><td>L1</td><td>Light</td><td>Moderate</td></tr>
          <tr><td>L2</td><td>Light</td><td>Low</td></tr>
          <tr><td>L3</td><td>Light</td><td>Moderate</td></tr>
        </tbody>
      </table>

      <p>
        H3 is the most variable and functionally important CDR loop. It&rsquo;s also the hardest
        to predict accurately.
      </p>

      <h2 id="usage">Using the antibody predictor</h2>

      <ol>
        <li>Navigate to <strong>/app/antibody</strong></li>
        <li>Paste your heavy chain sequence in the first input box</li>
        <li>Paste your light chain sequence in the second input box</li>
        <li>Click <strong>&ldquo;Predict structure&rdquo;</strong></li>
        <li>View the 3D structure with color-coded CDR loops</li>
        <li>Download the PDB file for further analysis</li>
      </ol>

      <p><Link href="/docs/ai-assistant">Next: AI assistant &rarr;</Link></p>
    </>
  );
}
