import Link from 'next/link';

export const metadata = {
  title: 'Affinity Prediction',
  description:
    'How OpenDDE uses Boltz-2 to predict binding affinity (pIC50, binder probability) for protein-ligand pairs, plus the limits of those numbers.',
};

export default function AffinityPredictionPage() {
  return (
    <>
      <h1>Affinity prediction</h1>

      <p>
        OpenDDE uses <strong>Boltz-2</strong> to predict the binding affinity of small
        molecules against protein targets. Unlike a docking score, Boltz-2 produces a
        physically interpretable affinity head trained on experimental binding data.
      </p>

      <h2 id="what-it-predicts">What it predicts</h2>

      <p>For each ligand the model returns several numbers:</p>

      <ul>
        <li>
          <strong>pIC50 / pKi</strong> &mdash; the negative log of the predicted IC50 in
          molar units. A value of 7 means a predicted IC50 of 100 nM. Higher is better.
        </li>
        <li>
          <strong>IC50 (nM)</strong> &mdash; the same number expressed back in
          concentration units, derived from pIC50.
        </li>
        <li>
          <strong>Binder probability</strong> (<code>affinity_probability_binary</code>)
          &mdash; the model&rsquo;s confidence that the ligand is a true binder versus a
          decoy. This is the number to trust most for triage.
        </li>
        <li>
          <strong>Confidence</strong> &mdash; iPTM (interface predicted-TM, 0&ndash;1) and
          complex pLDDT. These describe how confident the model is in the predicted
          binding pose, not in the affinity itself.
        </li>
      </ul>

      <h2 id="how-to-read">How to read the numbers</h2>

      <p>
        OpenDDE colours the predicted pKi cell green when iPTM &ge; 0.7, slate when
        iPTM is between 0.5 and 0.7, and amber with an asterisk (<code>*</code>) when
        iPTM &lt; 0.5. A high pKi with low iPTM means the model is unsure about the
        pose, which usually means you should not trust the magnitude.
      </p>

      <p>
        Hover any predicted cell to see the full breakdown:
        <code>pKi 7.2 &middot; IC50 63 nM &middot; iPTM 0.82 &middot; pLDDT 87 &middot; binder 91%</code>.
      </p>

      <h2 id="binary-vs-magnitude">Binary classifier vs quantitative ranking</h2>

      <p>
        Boltz-2 is a strong binary classifier &mdash; it tells you whether a molecule is
        likely to bind your target at all. It is much weaker at fine-grained ranking
        of close structural analogs whose true pKi values differ by less than one log
        unit.
      </p>

      <p>The practical rule of thumb:</p>

      <ul>
        <li>
          For <strong>hit discovery</strong> across diverse compounds &mdash; use
          <code>affinity_probability_binary</code> as your primary signal.
        </li>
        <li>
          For <strong>lead optimization</strong> within a series &mdash; trust the
          ordering only weakly; rely on experimental SAR for pKi differences smaller
          than 1 unit.
        </li>
      </ul>

      <h2 id="limitations">Honest limitations</h2>

      <ul>
        <li>
          <strong>Metals in SMILES</strong>: ligands containing metal atoms
          (e.g. <code>[Fe]</code>, <code>[Pt]</code>) fail standardization and are
          rejected. The UI surfaces this with a friendly error.
        </li>
        <li>
          <strong>Pockets with cofactors</strong>: targets that need a metal cofactor,
          essential structural water, or undergo large allosteric motions are
          systematically harder. Treat predictions on those targets as exploratory.
        </li>
        <li>
          <strong>Top-of-list collapse</strong>: a March 2026 evaluation
          (arXiv:2603.05532) found that within the top-performing compounds, Boltz-2&rsquo;s
          ranking signal is much weaker than the overall AUROC suggests. Always
          validate top hits experimentally.
        </li>
      </ul>

      <h2 id="tips">Tips for best accuracy</h2>

      <ul>
        <li>
          Keep <code>use_msa_server</code> enabled in the Boltz service &mdash; the
          accuracy gain over no-MSA inference is large.
        </li>
        <li>
          Pre-validate SMILES with <code>POST /api/v1/validate</code> before
          submitting big batches; the screening UI does this automatically.
        </li>
        <li>
          For production use, point <code>BOLTZ_SERVICE_URL</code> at a GPU instance.
          See <Link href="/docs/microservices">Microservices</Link> for swap-in options.
        </li>
      </ul>

      <h2 id="next">Next</h2>

      <ul>
        <li>
          <Link href="/docs/virtual-screening">Virtual screening</Link> &mdash; how to
          run hundreds of predictions as a single campaign.
        </li>
        <li>
          <Link href="/docs/complex-prediction">Complex prediction</Link> &mdash; promote
          a top hit to an AlphaFold 3 / Vina pose.
        </li>
      </ul>
    </>
  );
}
