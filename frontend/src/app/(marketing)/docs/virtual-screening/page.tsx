import Link from 'next/link';

export const metadata = {
  title: 'Virtual Screening',
  description:
    'Run Boltz-2 affinity predictions across many ligands in a single campaign. Input formats, runtimes, interpretation, and how to shortlist top hits for complex prediction.',
};

export default function VirtualScreeningPage() {
  return (
    <>
      <h1>Virtual screening</h1>

      <p>
        The <Link href="/app/screen">/app/screen</Link> page submits a single
        Boltz-2 campaign covering up to 1000 ligands at once. Results stream in live
        as each prediction completes and persist to Postgres so they survive page
        reloads and tab closes.
      </p>

      <h2 id="input">Input formats</h2>

      <p>You can supply ligands in four ways:</p>

      <ul>
        <li>
          <strong>Paste SMILES</strong>: one ligand per line, tab-separated as
          <code> name &lt;TAB&gt; smiles</code>. Lines starting with <code>#</code> are
          ignored. Comma- and whitespace-separated formats also parse.
        </li>
        <li>
          <strong>Upload .smi / .csv</strong>: drag-and-drop. The RDKit
          <code> SMILES &lt;TAB&gt; name </code>convention is auto-detected and
          rewritten to OpenDDE&rsquo;s <code>name &lt;TAB&gt; smiles</code> form.
        </li>
        <li>
          <strong>ChEMBL known ligands</strong>: pulls every compound annotated as active
          against the chosen target via the existing <code>/ligands</code> endpoint.
        </li>
        <li>
          <strong>FDA-approved set</strong>: a bundled starter list of ~30 well-known
          drugs (<code>public/data/fda_approved_drugs.json</code>). Append entries with
          <code> &#123;name, smiles, chembl_id?&#125; </code>and reload.
        </li>
      </ul>

      <p>
        Each SMILES is validated client-side via <code>POST /api/v1/validate</code> with
        a 600 ms debounce. Invalid entries surface a red chip in the count strip and
        are silently dropped at submit time.
      </p>

      <h2 id="runtime">Expected runtimes</h2>

      <table>
        <thead>
          <tr>
            <th>Hardware</th>
            <th>Per prediction</th>
            <th>50 ligands</th>
            <th>500 ligands</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Local CPU (M1/M2 Mac)</td>
            <td>3&ndash;8 min</td>
            <td>2.5&ndash;7 hours</td>
            <td>&gt; 1 day</td>
          </tr>
          <tr>
            <td>Cloud GPU (A10G)</td>
            <td>20&ndash;60 s</td>
            <td>15&ndash;50 min</td>
            <td>3&ndash;8 hours</td>
          </tr>
          <tr>
            <td>NIM / dedicated A100</td>
            <td>10&ndash;30 s</td>
            <td>10&ndash;25 min</td>
            <td>1&ndash;4 hours</td>
          </tr>
        </tbody>
      </table>

      <p>
        On the first prediction the Boltz container downloads ~3 GB of model weights
        (cached in the <code>boltz-cache</code> Docker volume). The OpenDDE UI shows a
        warmup banner during this 5&ndash;15 min download &mdash; subsequent predictions start
        immediately.
      </p>

      <h2 id="interpretation">Interpreting the rank-ordered list</h2>

      <p>
        The results page (<code>/app/screen/results/&#91;id&#93;</code>) sorts by
        predicted pKi descending by default. <strong>Treat this as a triage tool, not
        a final answer</strong>:
      </p>

      <ul>
        <li>
          The top of the list is high-confidence binders, not necessarily the most
          potent ones in absolute terms.
        </li>
        <li>
          Within the top 20, fine pKi differences (&lt; 1 log unit) are not reliable.
          Filter by binder probability (&ge; 0.7) and Lipinski pass to focus on
          drug-like binders.
        </li>
        <li>
          Use the &ldquo;Experimental vs predicted&rdquo; scatter on the pocket detail
          page to gut-check whether Boltz-2 is performing well on this specific
          target before trusting the screen.
        </li>
      </ul>

      <h2 id="shortlist">Shortlisting top hits</h2>

      <p>
        Each result row has a <strong>Predict complex</strong> button that hands the
        ligand to the existing AlphaFold 3 / AutoDock Vina workflow. The recommended
        flow:
      </p>

      <ol>
        <li>Apply filters: min pKi 6, min binder 70%, Lipinski pass only.</li>
        <li>Export the filtered list as CSV for offline triage.</li>
        <li>
          Pick the top 5&ndash;10 to push into <Link href="/docs/complex-prediction">
          complex prediction</Link> for explicit binding-pose modeling.
        </li>
        <li>
          Validate experimentally before drawing any quantitative conclusions.
        </li>
      </ol>

      <h2 id="campaign-state">Persistence and resumption</h2>

      <p>
        Campaigns are stored in the <code>screening_campaigns</code> and
        <code>screening_job_map</code> tables; individual predictions live in
        <code>affinity_predictions</code>. The pocket detail page automatically
        rehydrates predictions for any target you visit and resumes polling for
        in-flight jobs &mdash; closing the tab does not abort a screen.
      </p>

      <h2 id="next">Next</h2>

      <ul>
        <li>
          <Link href="/docs/affinity-prediction">Affinity prediction</Link> &mdash; what
          the pKi and binder-probability numbers actually mean.
        </li>
        <li>
          <Link href="/docs/api-reference">API reference</Link> &mdash; the underlying
          <code>/affinity/screen</code> and <code>/affinity/campaign/&#123;id&#125;</code>
          endpoints.
        </li>
      </ul>
    </>
  );
}
