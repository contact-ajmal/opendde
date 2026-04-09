import Link from 'next/link';

export const metadata = { title: 'Complex Prediction', description: 'How AlphaFold 3 predicts protein-ligand binding poses and confidence metrics.' };

export default function ComplexPredictionPage() {
  return (
    <>
      <h1>Complex prediction</h1>

      <p>
        Complex prediction answers the question: <em>how exactly does a drug molecule sit inside
        a protein&rsquo;s binding pocket?</em> This 3D arrangement is called a{' '}
        <strong>binding pose</strong>, and knowing it is critical for designing better drugs.
      </p>

      <h2 id="what-is-docking">What is molecular docking?</h2>

      <p>
        Imagine you have a lock (the protein pocket) and a key (the drug molecule). Molecular
        docking is the computational process of figuring out:
      </p>

      <ol>
        <li><strong>Where</strong> the key fits into the lock (the binding site)</li>
        <li><strong>How</strong> the key is oriented (the pose)</li>
        <li><strong>How well</strong> the key fits (the binding energy)</li>
      </ol>

      <p>
        Traditional docking programs (AutoDock, Glide) use physics-based scoring functions. AlphaFold
        3 takes a fundamentally different approach: it uses deep learning trained on millions of
        known protein-ligand complexes.
      </p>

      <h2 id="how-alphafold3-works">How AlphaFold 3 works (simplified)</h2>

      <p>
        AlphaFold 3 uses a <strong>diffusion-based architecture</strong>. Here&rsquo;s the
        simplified process:
      </p>

      <ol>
        <li>
          <strong>Input encoding</strong> &mdash; The protein sequence, ligand structure (SMILES),
          and any known templates are encoded into a joint representation.
        </li>
        <li>
          <strong>Pairwise attention</strong> &mdash; The model reasons about all pairwise
          interactions between protein residues and ligand atoms.
        </li>
        <li>
          <strong>Diffusion generation</strong> &mdash; Starting from random atom positions, the
          model iteratively refines the 3D coordinates through a denoising process (similar to
          how image diffusion models like DALL-E work, but in 3D).
        </li>
        <li>
          <strong>Confidence scoring</strong> &mdash; The model outputs confidence metrics for
          the prediction.
        </li>
      </ol>

      <h2 id="workflow">The semi-automated workflow</h2>

      <p>
        OpenDDE uses a semi-automated workflow for complex prediction due to AlphaFold Server&rsquo;s
        terms of service:
      </p>

      <ol>
        <li>
          <strong>Prepare</strong> &mdash; Select a target and ligand in OpenDDE. Click
          &ldquo;Predict complex&rdquo;. OpenDDE generates an AlphaFold 3 job JSON file.
        </li>
        <li>
          <strong>Submit</strong> &mdash; Copy the JSON and submit it to the{' '}
          <a href="https://alphafoldserver.com" target="_blank" rel="noopener noreferrer">
            AlphaFold Server
          </a>
          . This typically takes 5&ndash;30 minutes.
        </li>
        <li>
          <strong>Upload</strong> &mdash; Download the results (CIF file) from AlphaFold Server and
          upload them back to OpenDDE.
        </li>
        <li>
          <strong>Analyze</strong> &mdash; OpenDDE renders the complex in 3D and provides
          confidence metrics, contact analysis, and AI interpretation.
        </li>
      </ol>

      <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="text-sm text-foreground">
          <strong>Why semi-automated?</strong> AlphaFold Server currently requires manual submission
          through their web interface. As API access becomes available, OpenDDE will automate this
          step entirely.
        </p>
      </div>

      <h2 id="confidence-scores">Understanding confidence scores</h2>

      <p>
        AlphaFold 3 provides several confidence metrics:
      </p>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Range</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>iPTM</strong></td>
            <td>0&ndash;1</td>
            <td>
              Interface predicted TM-score. Measures confidence in the protein-ligand interface.
              Above 0.8 is high confidence; below 0.5 is unreliable.
            </td>
          </tr>
          <tr>
            <td><strong>pLDDT</strong></td>
            <td>0&ndash;100</td>
            <td>
              Per-residue confidence. Above 90 is very high; 70&ndash;90 is confident; below 50 is
              low confidence (often disordered regions).
            </td>
          </tr>
          <tr>
            <td><strong>PAE</strong></td>
            <td>0&ndash;31 &Aring;</td>
            <td>
              Predicted aligned error. Lower is better. Measures expected position error between
              residue pairs.
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="limitations">Limitations of predicted structures</h2>

      <ul>
        <li>
          <strong>Not experimental</strong> &mdash; Predicted complexes are computational models,
          not X-ray crystal structures. Always validate with experiments when possible.
        </li>
        <li>
          <strong>Single conformation</strong> &mdash; The prediction shows one possible binding
          mode. In reality, the drug may bind in multiple orientations.
        </li>
        <li>
          <strong>No water molecules</strong> &mdash; Water-mediated interactions are not explicitly
          modeled but can be important for binding.
        </li>
        <li>
          <strong>Novel scaffolds</strong> &mdash; Predictions may be less reliable for molecules
          very different from the training data.
        </li>
        <li>
          <strong>Flexible loops</strong> &mdash; Regions of the protein that are intrinsically
          disordered may be incorrectly positioned in the complex.
        </li>
      </ul>

      <p>
        <Link href="/docs/antibody-modeling">Next: Antibody modeling &rarr;</Link>
      </p>
    </>
  );
}
