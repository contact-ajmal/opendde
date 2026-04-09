import Link from 'next/link';

export const metadata = { title: 'SAR Analysis', description: 'Structure-activity relationships and activity cliff detection.' };

export default function SarAnalysisPage() {
  return (
    <>
      <h1>SAR analysis</h1>

      <p>
        Structure-Activity Relationship (SAR) analysis examines how changes in a molecule&rsquo;s
        chemical structure affect its biological activity. OpenDDE provides two key SAR tools:
        the <strong>SAR scatter plot</strong> and <strong>activity cliff detection</strong>.
      </p>

      <h2 id="sar-plot">SAR scatter plot</h2>

      <p>
        The SAR plot visualizes all known ligands for a target on a 2D chart:
      </p>

      <ul>
        <li><strong>X-axis</strong>: Molecular weight (Da)</li>
        <li><strong>Y-axis</strong>: Activity (nM, log scale)</li>
        <li><strong>Color</strong>: Clinical phase (if applicable)</li>
        <li><strong>Size</strong>: LogP value</li>
      </ul>

      <p>
        This visualization helps you quickly identify the &ldquo;sweet spot&rdquo; &mdash; compounds
        that are both potent (low nM) and drug-like (moderate MW).
      </p>

      <h2 id="activity-cliffs">Activity cliffs</h2>

      <p>
        An activity cliff is a pair of molecules that are:
      </p>

      <ul>
        <li><strong>Structurally similar</strong> (Tanimoto similarity &gt; 0.7 on Morgan fingerprints)</li>
        <li><strong>Biologically different</strong> (activity ratio &gt; 10&times;)</li>
      </ul>

      <p>
        These are valuable because they reveal which small structural modifications cause the
        biggest changes in potency. OpenDDE automatically detects and ranks activity cliffs,
        showing side-by-side comparisons of each pair.
      </p>

      <h2 id="how-computed">How cliffs are computed</h2>

      <ol>
        <li>All ligands with valid SMILES and activity data are collected (capped at 30)</li>
        <li>Pairwise Tanimoto similarity is computed using Morgan fingerprints (radius 2)</li>
        <li>Pairs with similarity &gt; 0.7 and activity ratio &gt; 10&times; are flagged</li>
        <li>Top 10 cliffs are returned, sorted by activity ratio</li>
      </ol>

      <h2 id="interpreting">Interpreting results</h2>

      <table>
        <thead>
          <tr><th>Activity ratio</th><th>Significance</th></tr>
        </thead>
        <tbody>
          <tr><td>&gt; 100&times;</td><td>Major cliff &mdash; small change, dramatic effect</td></tr>
          <tr><td>10&ndash;100&times;</td><td>Moderate cliff &mdash; worth investigating</td></tr>
        </tbody>
      </table>

      <p><Link href="/docs/architecture">Next: System architecture &rarr;</Link></p>
    </>
  );
}
