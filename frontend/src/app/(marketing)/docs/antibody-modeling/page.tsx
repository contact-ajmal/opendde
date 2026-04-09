import Link from 'next/link';

export const metadata = { title: 'Antibody Modeling', description: 'Predict antibody 3D structures from sequences using ImmuneBuilder.' };

export default function AntibodyModelingPage() {
  return (
    <>
      <h1>Antibody modeling</h1>

      <p>
        OpenDDE integrates <strong>ImmuneBuilder</strong> to predict antibody 3D structures directly from heavy and light chain amino acid sequences. The resulting structures include annotated CDR loops (H1–H3, L1–L3) for analysis.
      </p>

      <h2 id="how-it-works">How it works</h2>

      <ol>
        <li>Navigate to the <strong>Antibody</strong> page from the sidebar</li>
        <li>Paste your heavy chain and light chain amino acid sequences</li>
        <li>Click <strong>Predict structure</strong></li>
        <li>The ImmuneBuilder service generates a 3D PDB structure</li>
        <li>View the result in the interactive 3D viewer with CDR loops color-coded</li>
      </ol>

      <h2 id="cdr-annotation">CDR loop annotation</h2>

      <p>
        Complementarity-Determining Regions (CDRs) are the most variable parts of the antibody and are responsible for antigen binding. OpenDDE highlights all six CDR loops:
      </p>

      <ul>
        <li><strong>H1, H2, H3</strong> — Heavy chain CDRs</li>
        <li><strong>L1, L2, L3</strong> — Light chain CDRs</li>
      </ul>

      <p>
        H3 is typically the most variable and important for antigen specificity.
      </p>

      <h2 id="immunebuilder">About ImmuneBuilder</h2>

      <p>
        ImmuneBuilder is developed by the Oxford Protein Informatics Group (OPIG). It uses deep learning to predict antibody structures with accuracy comparable to AlphaFold, but specialized for immunoglobulin folds.
      </p>

      <h2 id="use-cases">Use cases</h2>

      <ul>
        <li>Analyze therapeutic antibody candidates</li>
        <li>Study CDR loop conformations for engineering</li>
        <li>Compare predicted structures with experimental data</li>
        <li>Visualize paratope-epitope interactions</li>
      </ul>

      <p><Link href="/docs/complex-prediction">&larr; Complex prediction</Link> · <Link href="/docs/ai-assistant">AI assistant &rarr;</Link></p>
    </>
  );
}
