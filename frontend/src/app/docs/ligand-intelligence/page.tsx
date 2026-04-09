import Link from 'next/link';

export const metadata = { title: 'Ligand Intelligence' };

export default function LigandIntelligencePage() {
  return (
    <>
      <h1>Ligand intelligence</h1>

      <p>
        Once you&rsquo;ve identified a protein target, the next question is: <em>what molecules
        are already known to bind to it?</em> OpenDDE pulls bioactivity data from{' '}
        <strong>ChEMBL</strong>, the world&rsquo;s largest open database of drug-like molecules
        with experimental binding data.
      </p>

      <h2 id="bioactivity-data">What is bioactivity data?</h2>

      <p>
        Bioactivity data tells you how strongly a molecule binds to a protein target. This is
        measured experimentally in a lab. The most common measurements are:
      </p>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Full name</th>
            <th>What it measures</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>IC50</strong></td>
            <td>Half-maximal inhibitory concentration</td>
            <td>The concentration needed to inhibit 50% of the target&rsquo;s activity. Lower = more potent.</td>
          </tr>
          <tr>
            <td><strong>Ki</strong></td>
            <td>Inhibition constant</td>
            <td>The binding affinity of an inhibitor. Lower = tighter binding.</td>
          </tr>
          <tr>
            <td><strong>Kd</strong></td>
            <td>Dissociation constant</td>
            <td>How tightly a molecule binds overall. Lower = stronger binding.</td>
          </tr>
          <tr>
            <td><strong>EC50</strong></td>
            <td>Half-maximal effective concentration</td>
            <td>The concentration needed for 50% of the maximum biological effect.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Values are typically reported in <strong>nanomolar (nM)</strong>. A compound with an IC50
        of 10 nM is very potent; one with 10,000 nM (10 &mu;M) is weak.
      </p>

      <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-foreground">
          <strong>Rule of thumb:</strong> A &ldquo;hit&rdquo; in drug discovery typically has activity
          below 10,000 nM. A &ldquo;lead&rdquo; is below 1,000 nM. A clinical candidate is usually
          below 100 nM.
        </p>
      </div>

      <h2 id="clinical-phases">Understanding clinical phases</h2>

      <p>
        Some compounds in ChEMBL have reached clinical trials. OpenDDE shows the clinical phase
        where applicable:
      </p>

      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>What happens</th>
            <th>Typical size</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase I</strong></td>
            <td>Safety testing in healthy volunteers</td>
            <td>20&ndash;100 people</td>
          </tr>
          <tr>
            <td><strong>Phase II</strong></td>
            <td>Efficacy and dose-finding in patients</td>
            <td>100&ndash;300 people</td>
          </tr>
          <tr>
            <td><strong>Phase III</strong></td>
            <td>Large-scale efficacy confirmation</td>
            <td>1,000&ndash;3,000 people</td>
          </tr>
          <tr>
            <td><strong>Phase IV</strong></td>
            <td>Post-market surveillance</td>
            <td>Ongoing monitoring</td>
          </tr>
          <tr>
            <td><strong>Approved</strong></td>
            <td>FDA/EMA approved drug</td>
            <td>Available to patients</td>
          </tr>
        </tbody>
      </table>

      <h2 id="ligand-table">How to read the ligand table</h2>

      <p>
        The ligand table in OpenDDE shows all known compounds for your target. Key columns:
      </p>

      <ul>
        <li><strong>Name / ChEMBL ID</strong> &mdash; The compound identifier. Click to see its 2D structure.</li>
        <li><strong>Activity type</strong> &mdash; IC50, Ki, Kd, or EC50.</li>
        <li><strong>Activity (nM)</strong> &mdash; The measured value. Sortable: lower is more potent.</li>
        <li><strong>Phase</strong> &mdash; Clinical development stage (if applicable).</li>
        <li><strong>SMILES</strong> &mdash; The molecular structure in text format.</li>
      </ul>

      <p>
        You can sort by any column by clicking the header. The table supports searching and filtering.
      </p>

      <h2 id="drug-likeness">What &ldquo;drug-like&rdquo; means</h2>

      <p>
        Not every molecule that binds a target can become a drug. It also needs to be absorbed,
        distributed, metabolized, and excreted safely. <strong>Lipinski&rsquo;s Rule of Five</strong>{' '}
        is a quick filter:
      </p>

      <ul>
        <li>Molecular weight &le; 500 Da</li>
        <li>LogP (lipophilicity) &le; 5</li>
        <li>Hydrogen bond donors &le; 5</li>
        <li>Hydrogen bond acceptors &le; 10</li>
      </ul>

      <p>
        Compounds violating more than one rule are less likely to be orally bioavailable. OpenDDE
        computes these properties via RDKit and flags violations in the{' '}
        <Link href="/docs/druglikeness-scoring">druglikeness scoring</Link> panel.
      </p>

      <h2 id="activity-cliffs">How activity cliffs help drug design</h2>

      <p>
        An <strong>activity cliff</strong> is a pair of molecules that are structurally very similar
        (Tanimoto similarity &gt; 0.7) but have drastically different binding activity (ratio &gt;
        10&times;). These cliffs are goldmines for medicinal chemists because they reveal which
        small structural changes have the biggest impact on potency.
      </p>

      <p>
        OpenDDE automatically detects activity cliffs for your target and highlights the most
        significant pairs. See <Link href="/docs/sar-analysis">SAR analysis</Link> for more.
      </p>

      <p>
        <Link href="/docs/complex-prediction">Next: Complex prediction &rarr;</Link>
      </p>
    </>
  );
}
