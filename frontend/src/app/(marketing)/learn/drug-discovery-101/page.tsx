import Link from 'next/link';

export const metadata = {
  title: 'Drug Discovery 101',
  description: 'The complete beginner\'s guide to how new medicines are found — from target identification to FDA approval.',
};

export default function DrugDiscovery101Page() {
  return (
    <>
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          Beginner
        </span>
        <h1 id="top">Drug discovery 101</h1>
        <p className="lead">
          The complete beginner&rsquo;s guide to how new medicines are found. No biology degree
          required &mdash; just curiosity.
        </p>
      </header>

      {/* ── Section 1 ──────────────────────────────────────── */}
      <h2 id="what-is-drug-discovery">What is drug discovery?</h2>

      <p>
        Drug discovery is the process of finding new medicines. It starts with a question &mdash;
        <em>what causes this disease?</em> &mdash; and ends, years later, with a pill, injection,
        or infusion that a patient can take.
      </p>

      <p>
        Here&rsquo;s an analogy that makes it click:
      </p>

      <div className="callout">
        <div className="callout-title">The city analogy</div>
        <p>
          Imagine your body is a city. <strong>Proteins</strong> are the workers: some deliver
          packages (transport proteins), some build roads (structural proteins), some direct
          traffic (signaling proteins). The city runs smoothly because each worker does their
          job correctly.
        </p>
        <p>
          <strong>Disease</strong> happens when a worker malfunctions. Maybe a traffic director
          goes rogue and sends too many signals, causing a traffic jam (cancer). Maybe a builder
          starts tearing down walls instead of building them (autoimmune disease).
        </p>
        <p>
          A <strong>drug</strong> is a tiny tool designed to fix or block that specific broken
          worker. A good drug finds the right worker, slots into its toolbelt, and either fixes
          the malfunction or shuts the worker down entirely. It does this without bothering the
          other workers in the city.
        </p>
      </div>

      <p>
        That&rsquo;s drug discovery in a nutshell: find the broken worker, understand its shape,
        and design a tool that fits perfectly.
      </p>

      {/* ── Section 2 ──────────────────────────────────────── */}
      <h2 id="the-pipeline">The drug discovery pipeline</h2>

      <p>
        Bringing a new drug to patients takes 10&ndash;15 years and costs over $1 billion on
        average. Here&rsquo;s what happens at each stage:
      </p>

      <h3 id="target-identification">1. Target identification (1&ndash;2 years)</h3>
      <p>
        Scientists identify which protein is causing the disease. This involves studying diseased
        cells, analyzing patient genetics, and reading thousands of research papers. The output is
        a <strong>drug target</strong> &mdash; a specific protein that, if modified by a drug,
        should treat the disease.
      </p>
      <p>
        <em>Example: Researchers discovered that a protein called <strong>EGFR</strong> (Epidermal
        Growth Factor Receptor) is overactive in many lung cancers. Blocking EGFR could slow tumor
        growth.</em>
      </p>

      <h3 id="target-validation">2. Target validation (1&ndash;2 years)</h3>
      <p>
        Before investing millions, scientists verify that the target actually drives the disease.
        They use techniques like gene knockout (turning off the protein in lab animals) and
        clinical genetics (checking if people with mutations in the target gene have different
        disease outcomes).
      </p>

      <h3 id="hit-finding">3. Hit finding (1&ndash;2 years)</h3>
      <p>
        Now scientists search for molecules (&ldquo;hits&rdquo;) that bind to the target protein.
        Methods include:
      </p>
      <ul>
        <li><strong>High-throughput screening (HTS)</strong> &mdash; Physically test millions of
          compounds in robotic assays</li>
        <li><strong>Virtual screening</strong> &mdash; Use computers to predict which molecules
          will bind (this is where OpenDDE helps!)</li>
        <li><strong>Fragment-based drug design</strong> &mdash; Start with tiny molecular fragments
          and grow them into full drug candidates</li>
      </ul>

      <h3 id="lead-optimization">4. Lead optimization (2&ndash;3 years)</h3>
      <p>
        A &ldquo;hit&rdquo; that binds the target isn&rsquo;t a drug yet. It needs to be optimized
        for potency (how strongly it binds), selectivity (binding only the target, not other
        proteins), and drug-likeness (can it actually get into the body?). Medicinal chemists tweak
        the molecule&rsquo;s structure hundreds of times to improve these properties.
      </p>

      <div className="callout callout-emerald">
        <div className="callout-title">Where OpenDDE fits in</div>
        <p>
          OpenDDE helps with stages 1&ndash;4: identifying targets, discovering binding pockets,
          browsing known compounds, and analyzing structure-activity relationships. It compresses
          months of manual work into minutes of computational exploration.
        </p>
      </div>

      <h3 id="preclinical">5. Preclinical testing (1&ndash;2 years)</h3>
      <p>
        Before testing in humans, the drug candidate is tested in laboratory cell cultures and
        animal models for safety and efficacy. Researchers check for toxicity, determine safe
        dosing ranges, and study how the drug is absorbed and eliminated.
      </p>

      <h3 id="clinical-trials">6. Clinical trials (6&ndash;10 years)</h3>

      <table>
        <thead>
          <tr><th>Phase</th><th>Purpose</th><th>Participants</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase I</strong></td>
            <td>Safety: is the drug safe in humans?</td>
            <td>20&ndash;100 healthy volunteers</td>
            <td>~1 year</td>
          </tr>
          <tr>
            <td><strong>Phase II</strong></td>
            <td>Efficacy: does the drug actually work?</td>
            <td>100&ndash;300 patients</td>
            <td>1&ndash;2 years</td>
          </tr>
          <tr>
            <td><strong>Phase III</strong></td>
            <td>Confirmation: large-scale proof</td>
            <td>1,000&ndash;3,000 patients</td>
            <td>2&ndash;4 years</td>
          </tr>
        </tbody>
      </table>

      <p>
        Over 90% of drug candidates that enter clinical trials fail. The most common reasons:
        the drug doesn&rsquo;t work well enough in humans (efficacy), or it causes unexpected
        side effects (safety).
      </p>

      <h3 id="approval">7. Regulatory approval</h3>
      <p>
        If Phase III is successful, the company submits a massive data package to regulatory
        agencies (FDA in the US, EMA in Europe). Review takes 6&ndash;18 months. If approved,
        the drug can be prescribed to patients.
      </p>

      {/* ── Section 3 ──────────────────────────────────────── */}
      <h2 id="what-are-proteins">What are proteins?</h2>

      <p>
        Proteins are the molecular machines that do almost everything in your body. They&rsquo;re
        made of long chains of <strong>amino acids</strong> &mdash; think of them as beads on a
        string. There are 20 different amino acids, and their sequence determines the
        protein&rsquo;s identity.
      </p>

      <p>
        The chain folds into a specific <strong>3D shape</strong>. This shape is everything: it
        determines what the protein can do, what it can bind to, and how drugs interact with it.
        A protein with the wrong shape is like a key that doesn&rsquo;t fit any lock &mdash;
        useless and potentially harmful.
      </p>

      <div className="callout">
        <div className="callout-title">Key fact</div>
        <p>
          The human body contains roughly 20,000 different proteins. Each one has a unique 3D
          shape. Predicting these shapes from amino acid sequences was one of the grand
          challenges of biology &mdash; until <strong>AlphaFold</strong> solved it in 2020.
        </p>
      </div>

      <p>
        When a protein is <strong>overactive</strong> (producing too many signals), underactive
        (not doing its job), or <strong>mutated</strong> (wrong shape), disease can result.
        Drug discovery aims to find molecules that interact with these proteins to restore
        normal function.
      </p>

      {/* ── Section 4 ──────────────────────────────────────── */}
      <h2 id="binding-pockets">What are binding pockets?</h2>

      <p>
        A binding pocket is a cavity, groove, or cleft on a protein&rsquo;s surface where a drug
        molecule can physically sit. Think of it like a parking spot: the pocket has a specific
        shape and chemical character, and only molecules that match can &ldquo;park&rdquo; there.
      </p>

      <h3 id="orthosteric-sites">Orthosteric sites</h3>
      <p>
        The <strong>active site</strong> of the protein &mdash; where its natural function happens.
        For an enzyme, this is where the chemical reaction occurs. Drugs targeting orthosteric sites
        directly compete with the natural substrate. These are the most obvious and well-studied
        binding pockets.
      </p>

      <h3 id="allosteric-sites">Allosteric sites</h3>
      <p>
        Secondary pockets located <em>away</em> from the active site. Binding here changes the
        protein&rsquo;s shape, which indirectly affects its function. Allosteric drugs can be highly
        selective because allosteric sites are often unique to a specific protein.
      </p>

      <h3 id="cryptic-sites">Cryptic sites</h3>
      <p>
        Hidden pockets that only appear when the protein moves or &ldquo;breathes.&rdquo; Proteins
        are not rigid &mdash; they flex and shift constantly. Some pockets open transiently, making
        them invisible to static structure analysis but potentially druggable in practice.
      </p>

      <div className="callout callout-amber">
        <div className="callout-title">In OpenDDE</div>
        <p>
          When you search for a protein target, P2Rank analyzes the 3D structure and ranks all
          detectable pockets by <strong>druggability score</strong> (0 to 1). A score above 0.8
          suggests a deep, well-defined cavity that&rsquo;s likely to bind drug-like molecules.
        </p>
      </div>

      {/* ── Section 5 ──────────────────────────────────────── */}
      <h2 id="what-makes-a-good-drug">What makes a good drug?</h2>

      <p>
        A molecule might bind perfectly to a protein in a test tube, but that doesn&rsquo;t make
        it a drug. It also needs to survive the journey through the human body. This is governed
        by <strong>Lipinski&rsquo;s Rule of Five</strong>, the most famous guideline in drug design:
      </p>

      <table>
        <thead>
          <tr><th>Property</th><th>Limit</th><th>Simple explanation</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Molecular weight</td>
            <td>&le; 500 Da</td>
            <td>Small enough to swallow and absorb through the gut</td>
          </tr>
          <tr>
            <td>LogP (lipophilicity)</td>
            <td>&le; 5</td>
            <td>Fat-soluble enough to cross cell membranes, but not so greasy it won&rsquo;t dissolve in blood</td>
          </tr>
          <tr>
            <td>H-bond donors</td>
            <td>&le; 5</td>
            <td>Not too &ldquo;sticky&rdquo; with water, so it can pass through membranes</td>
          </tr>
          <tr>
            <td>H-bond acceptors</td>
            <td>&le; 10</td>
            <td>Same reason &mdash; too polar and the molecule can&rsquo;t get into cells</td>
          </tr>
        </tbody>
      </table>

      <p>
        A good drug is a Goldilocks molecule: small enough to absorb, fat-soluble enough to cross
        membranes, water-soluble enough to dissolve in blood, and shaped just right to fit the
        target pocket.
      </p>

      {/* ── Section 6 ──────────────────────────────────────── */}
      <h2 id="computers-accelerate">How computers accelerate drug discovery</h2>

      <p>
        Traditional drug discovery is slow and expensive because it relies heavily on physical
        experiments. Computational approaches can dramatically speed up several stages:
      </p>

      <ul>
        <li>
          <strong>Virtual screening</strong> &mdash; Instead of physically testing millions of
          compounds, computers can score billions of virtual molecules against a target in days.
          This narrows the candidates from millions to hundreds.
        </li>
        <li>
          <strong>Structure prediction</strong> &mdash; AlphaFold can predict a protein&rsquo;s
          3D structure from its amino acid sequence, eliminating months of expensive X-ray
          crystallography.
        </li>
        <li>
          <strong>Binding affinity prediction</strong> &mdash; Machine learning models can
          estimate how strongly a molecule will bind to a pocket, prioritizing the most promising
          candidates for lab testing.
        </li>
        <li>
          <strong>ADMET prediction</strong> &mdash; Computational models predict absorption,
          distribution, metabolism, excretion, and toxicity before any animal testing.
        </li>
      </ul>

      <div className="callout callout-emerald">
        <div className="callout-title">OpenDDE&rsquo;s role</div>
        <p>
          OpenDDE integrates these computational approaches into a single platform. You can go
          from a protein name to a druggability assessment in minutes: predict pockets (P2Rank),
          explore known compounds (ChEMBL), predict binding poses (AlphaFold 3), and get AI
          interpretation (Claude) &mdash; all without writing code or managing infrastructure.
        </p>
      </div>

      {/* ── Section 7 ──────────────────────────────────────── */}
      <h2 id="future-ai-drug-design">The future: AI drug design</h2>

      <p>
        We&rsquo;re at an inflection point. For the first time, AI systems can predict molecular
        structures and interactions with near-experimental accuracy. Some milestones:
      </p>

      <ul>
        <li>
          <strong>AlphaFold 2 (2020)</strong> &mdash; Solved the protein structure prediction
          problem, predicting 3D shapes from sequences with experimental accuracy.
        </li>
        <li>
          <strong>AlphaFold 3 (2024)</strong> &mdash; Extended to predict protein-ligand,
          protein-DNA, and protein-protein complexes.
        </li>
        <li>
          <strong>IsoDDE (2025)</strong> &mdash; Isomorphic Labs demonstrated that AI can more
          than double the accuracy of the best existing methods for predicting drug binding poses.
        </li>
        <li>
          <strong>Boltz-2 (2025)</strong> &mdash; Open-source structure prediction model reaching
          near-AlphaFold 3 accuracy.
        </li>
      </ul>

      <p>
        The trend is clear: drug design is becoming increasingly computational. The wet lab
        won&rsquo;t disappear &mdash; drugs still need to be physically synthesized and tested
        in patients &mdash; but the computational phase will identify better candidates faster,
        reducing the staggering failure rates and costs of traditional drug discovery.
      </p>

      <p>
        OpenDDE exists to make these tools accessible to everyone. Not just pharmaceutical
        companies with million-dollar software licenses, but every researcher, student, and
        startup working to find new treatments.
      </p>

      <hr />

      <p>
        <strong>Ready to try it?</strong> Follow the{' '}
        <Link href="/learn/target-to-drug">From target to drug</Link> walkthrough to explore
        a real drug target in OpenDDE, or jump to the{' '}
        <Link href="/docs/quick-start">Quick start guide</Link> to set up the platform.
      </p>
    </>
  );
}
