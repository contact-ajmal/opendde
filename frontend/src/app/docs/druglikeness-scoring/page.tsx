import Link from 'next/link';

export const metadata = { title: 'Druglikeness Scoring' };

export default function DruglikenessScoringPage() {
  return (
    <>
      <h1>Druglikeness scoring</h1>

      <p>
        Not every molecule that binds a target will make a good drug. It also needs favorable
        pharmacokinetic properties &mdash; absorption, distribution, metabolism, and excretion
        (ADME). OpenDDE computes druglikeness scores via <strong>RDKit</strong>.
      </p>

      <h2 id="lipinski">Lipinski&rsquo;s Rule of Five</h2>

      <p>
        The most widely used druglikeness filter, proposed by Christopher Lipinski in 1997. A
        compound is likely orally bioavailable if it does <strong>not</strong> violate more than
        one of these rules:
      </p>

      <table>
        <thead>
          <tr><th>Property</th><th>Threshold</th><th>Why it matters</th></tr>
        </thead>
        <tbody>
          <tr><td>Molecular weight</td><td>&le; 500 Da</td><td>Larger molecules have trouble crossing cell membranes</td></tr>
          <tr><td>LogP</td><td>&le; 5</td><td>Too lipophilic = poor solubility and high toxicity risk</td></tr>
          <tr><td>H-bond donors</td><td>&le; 5</td><td>Too many donors reduce membrane permeability</td></tr>
          <tr><td>H-bond acceptors</td><td>&le; 10</td><td>Too many acceptors reduce membrane permeability</td></tr>
        </tbody>
      </table>

      <h2 id="veber">Veber&rsquo;s rules</h2>

      <p>Additional filters for oral bioavailability:</p>

      <ul>
        <li><strong>TPSA</strong> (topological polar surface area) &le; 140 &Aring;&sup2;</li>
        <li><strong>Rotatable bonds</strong> &le; 10</li>
      </ul>

      <h2 id="computed-properties">Computed properties</h2>

      <p>
        For every ligand, OpenDDE computes via RDKit:
      </p>

      <ul>
        <li>Molecular weight</li>
        <li>LogP (Wildman-Crippen method)</li>
        <li>Hydrogen bond donors and acceptors</li>
        <li>TPSA</li>
        <li>Rotatable bonds count</li>
        <li>Number of Lipinski violations</li>
      </ul>

      <p><Link href="/docs/druggability-reports">Next: Druggability reports &rarr;</Link></p>
    </>
  );
}
