import Link from 'next/link';

export const metadata = {
  title: 'From Target to Drug',
  description: 'Step-by-step EGFR walkthrough: search, pocket discovery, ligand analysis, complex prediction, and AI interpretation in OpenDDE.',
};

export default function TargetToDrugPage() {
  return (
    <>
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          Walkthrough
        </span>
        <h1 id="top">From target to drug: a complete walkthrough</h1>
        <p className="lead">
          Follow along step-by-step as we explore EGFR &mdash; a real cancer drug target &mdash;
          in OpenDDE. From searching to druggability assessment, this is the full workflow.
        </p>
      </header>

      {/* ── Background ─────────────────────────────────────── */}
      <h2 id="background">Background: why EGFR?</h2>

      <p>
        <strong>EGFR</strong> (Epidermal Growth Factor Receptor) is a protein on the surface of
        cells that tells them when to grow and divide. In healthy cells, EGFR is tightly regulated.
        But in many cancers &mdash; particularly <strong>non-small cell lung cancer (NSCLC)</strong>{' '}
        &mdash; EGFR is mutated and permanently stuck in the &ldquo;on&rdquo; position, driving
        uncontrolled cell growth.
      </p>

      <p>
        EGFR is one of the most studied drug targets in oncology. Several FDA-approved drugs
        (erlotinib, gefitinib, osimertinib) work by blocking EGFR&rsquo;s activity. This makes
        it a perfect example: we know the answer, so we can validate what OpenDDE shows us.
      </p>

      <div className="callout">
        <div className="callout-title">Follow along</div>
        <p>
          To follow this walkthrough in real time, make sure OpenDDE is running (<code>docker
          compose up</code>) and open <code>http://localhost:3000</code> in your browser.
        </p>
      </div>

      {/* ── Step 1 ─────────────────────────────────────────── */}
      <h2 id="step-1-search">Step 1: Search for the target</h2>

      <p>
        Click <strong>&ldquo;Launch app&rdquo;</strong> on the homepage to reach the dashboard.
        In the search bar, type <code>EGFR</code> or its UniProt ID <code>P00533</code>.
      </p>

      <p>
        OpenDDE resolves the target through UniProt, downloads the AlphaFold-predicted structure,
        and stores everything in the database. After a few seconds, you&rsquo;ll see the target
        page.
      </p>

      <div className="step-result">
        <div className="step-result-title">What you see</div>
        <ul>
          <li>A 3D protein structure rendered in the Mol* viewer</li>
          <li>Basic info: &ldquo;Epidermal growth factor receptor&rdquo;, gene name EGFR, Homo sapiens, 1210 amino acids</li>
          <li>Colored spheres on the structure showing predicted binding pockets</li>
        </ul>
      </div>

      {/* ── Step 2 ─────────────────────────────────────────── */}
      <h2 id="step-2-pockets">Step 2: Explore binding pockets</h2>

      <p>
        P2Rank has analyzed the EGFR structure and identified several binding pockets. The pocket
        list appears below the 3D viewer, ranked by score.
      </p>

      <p>
        <strong>Pocket 1</strong> is the top-ranked pocket. In a typical EGFR analysis, you&rsquo;ll
        see it has a high druggability score &mdash; this corresponds to the ATP-binding site in
        the kinase domain, which is exactly where approved EGFR drugs bind.
      </p>

      <p>Click on Pocket 1 to see its detail page:</p>

      <div className="step-result">
        <div className="step-result-title">What you see</div>
        <ul>
          <li><strong>Druggability score</strong> &mdash; High (indicating a deep, well-defined cavity)</li>
          <li><strong>Pocket residues</strong> &mdash; The amino acids that form the pocket walls (LEU718, VAL726, ALA743, etc.)</li>
          <li><strong>Radar chart</strong> &mdash; Composition breakdown: hydrophobic, polar, charged, aromatic ratios</li>
          <li><strong>3D highlight</strong> &mdash; The pocket is highlighted on the protein structure</li>
        </ul>
      </div>

      <div className="callout callout-emerald">
        <div className="callout-title">Why this pocket is druggable</div>
        <p>
          The ATP-binding site of EGFR is a deep, enclosed cavity with a predominantly hydrophobic
          interior &mdash; ideal for small-molecule binding. The mix of hydrophobic residues
          (for van der Waals contacts) and polar residues (for hydrogen bonds) creates a
          chemically rich environment that drug molecules can exploit.
        </p>
      </div>

      {/* ── Step 3 ─────────────────────────────────────────── */}
      <h2 id="step-3-ligands">Step 3: Browse known compounds</h2>

      <p>
        Scroll down to the <strong>Ligand Table</strong>. OpenDDE has pulled all known bioactive
        compounds for EGFR from ChEMBL. For a well-studied target like EGFR, there may be
        dozens of compounds.
      </p>

      <p>Key compounds you&rsquo;ll see:</p>

      <table>
        <thead>
          <tr><th>Compound</th><th>Activity</th><th>Phase</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Erlotinib</strong> (Tarceva)</td>
            <td>IC50 ~2 nM</td>
            <td>Approved</td>
            <td>First-generation EGFR inhibitor</td>
          </tr>
          <tr>
            <td><strong>Gefitinib</strong> (Iressa)</td>
            <td>IC50 ~33 nM</td>
            <td>Approved</td>
            <td>First-generation, reversible</td>
          </tr>
          <tr>
            <td><strong>Osimertinib</strong> (Tagrisso)</td>
            <td>IC50 ~12 nM</td>
            <td>Approved</td>
            <td>Third-generation, overcomes T790M resistance</td>
          </tr>
        </tbody>
      </table>

      <p>
        Sort by activity (click the column header) to find the most potent compounds. Sort by
        phase to see which compounds have reached clinical trials.
      </p>

      {/* ── Step 4 ─────────────────────────────────────────── */}
      <h2 id="step-4-sar">Step 4: Analyze structure-activity relationships</h2>

      <p>
        The <strong>SAR scatter plot</strong> visualizes all compounds on a molecular weight vs.
        activity chart. Look for:
      </p>

      <ul>
        <li><strong>Clusters</strong> &mdash; Groups of similar compounds. EGFR inhibitors tend to cluster around MW 400&ndash;500 Da.</li>
        <li><strong>Outliers</strong> &mdash; Unusually potent or unusually large compounds may be interesting leads.</li>
        <li><strong>Activity cliffs</strong> &mdash; Pairs of similar molecules with very different activities (highlighted automatically).</li>
      </ul>

      <p>
        If activity cliffs are found, they appear in a dedicated section. Each cliff shows two
        molecules side by side with their similarity score and activity ratio, helping you understand
        which structural features drive potency.
      </p>

      {/* ── Step 5 ─────────────────────────────────────────── */}
      <h2 id="step-5-complex">Step 5: Predict binding pose</h2>

      <p>
        Select a ligand (e.g., erlotinib) and click <strong>&ldquo;Predict complex&rdquo;</strong>.
        OpenDDE generates an AlphaFold 3 job file containing the EGFR sequence and
        erlotinib&rsquo;s SMILES structure.
      </p>

      <ol>
        <li>Copy the generated JSON</li>
        <li>Submit it to the AlphaFold Server</li>
        <li>Wait for the prediction (5&ndash;30 minutes)</li>
        <li>Download the result and upload it back to OpenDDE</li>
      </ol>

      <p>
        Once uploaded, OpenDDE renders the predicted complex &mdash; showing erlotinib docked
        inside EGFR&rsquo;s binding pocket. The confidence metrics (iPTM, pLDDT) tell you how
        reliable the prediction is.
      </p>

      {/* ── Step 6 ─────────────────────────────────────────── */}
      <h2 id="step-6-ai">Step 6: Get AI interpretation</h2>

      <p>
        Open the <strong>AI assistant</strong> drawer and ask questions like:
      </p>

      <ul>
        <li>&ldquo;Why is EGFR a good drug target?&rdquo;</li>
        <li>&ldquo;What makes Pocket 1 druggable?&rdquo;</li>
        <li>&ldquo;How could I modify erlotinib to improve selectivity?&rdquo;</li>
        <li>&ldquo;What resistance mutations should I worry about?&rdquo;</li>
      </ul>

      <p>
        The assistant has full context about the target, pockets, and ligands, so it can provide
        specific, scientifically grounded answers.
      </p>

      <div className="step-result">
        <div className="step-result-title">Example AI response</div>
        <p>
          &ldquo;EGFR is an excellent drug target for non-small cell lung cancer. Pocket 1
          corresponds to the ATP-binding site in the kinase domain, with a druggability score
          indicating a deep, well-defined cavity. The pocket is predominantly hydrophobic
          (Leu718, Val726, Ala743) with key hydrogen-bonding residues (Met793) that are
          exploited by approved inhibitors like erlotinib. The T790M gatekeeper mutation is a
          known resistance mechanism that third-generation inhibitors like osimertinib were
          designed to overcome.&rdquo;
        </p>
      </div>

      {/* ── Step 7 ─────────────────────────────────────────── */}
      <h2 id="step-7-report">Step 7: Generate a druggability report</h2>

      <p>
        Finally, navigate to the <strong>Report</strong> page for a comprehensive druggability
        assessment. The report summarizes everything: target info, pocket analysis, ligand
        landscape, safety signals, and an overall druggability score.
      </p>

      <p>
        Download the PDF to share with collaborators or include in grant applications.
      </p>

      {/* ── Summary ────────────────────────────────────────── */}
      <h2 id="summary">Summary</h2>

      <p>
        In this walkthrough, we:
      </p>

      <ol>
        <li>Searched for EGFR and loaded its AlphaFold structure</li>
        <li>Identified the top binding pocket (the ATP-binding site)</li>
        <li>Explored 45+ known inhibitors including approved drugs</li>
        <li>Analyzed structure-activity relationships and activity cliffs</li>
        <li>Predicted how erlotinib binds using AlphaFold 3</li>
        <li>Got AI-powered interpretation of the results</li>
        <li>Generated a complete druggability report</li>
      </ol>

      <p>
        This entire workflow &mdash; which would take weeks with traditional tools &mdash;
        takes <strong>minutes</strong> in OpenDDE.
      </p>

      <div className="callout callout-emerald">
        <div className="callout-title">Try it yourself</div>
        <p>
          EGFR is just one example. Try searching for other well-known drug targets:
          <strong> BCR-ABL</strong> (leukemia), <strong>HER2</strong> (breast cancer),
          <strong> BRAF</strong> (melanoma), or <strong>ACE2</strong> (COVID-19 entry receptor).
          Each will reveal different pocket architectures and compound landscapes.
        </p>
      </div>

      <hr />

      <p>
        <strong>Want to set up your own instance?</strong> Follow the{' '}
        <Link href="/docs/quick-start">Quick start guide</Link> to have OpenDDE running in
        under 5 minutes.
      </p>
    </>
  );
}
