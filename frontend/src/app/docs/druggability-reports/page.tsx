import Link from 'next/link';

export const metadata = { title: 'Druggability Reports', description: 'Generate target assessment reports in JSON and PDF.' };

export default function DruggabilityReportsPage() {
  return (
    <>
      <h1>Druggability reports</h1>

      <p>
        OpenDDE can generate comprehensive druggability assessment reports for any protein target.
        Reports are available in JSON (for programmatic access) and PDF (for sharing).
      </p>

      <h2 id="contents">What&rsquo;s in a report?</h2>

      <ul>
        <li><strong>Target summary</strong> &mdash; Protein name, gene, organism, sequence length</li>
        <li><strong>Pocket analysis</strong> &mdash; All predicted pockets with scores, residue
          composition, and druggability assessment</li>
        <li><strong>Ligand landscape</strong> &mdash; Known compounds, their activity ranges, and
          clinical development stages</li>
        <li><strong>Safety signals</strong> &mdash; Data from Open Targets on known safety concerns</li>
        <li><strong>Overall assessment</strong> &mdash; A summary druggability score with rationale</li>
      </ul>

      <h2 id="generating">Generating a report</h2>

      <ol>
        <li>Navigate to a target page (e.g., <code>/app/target/P00533</code>)</li>
        <li>Click the <strong>&ldquo;Report&rdquo;</strong> link in the navigation</li>
        <li>View the report in the browser or click <strong>&ldquo;Download PDF&rdquo;</strong></li>
      </ol>

      <h2 id="api">API access</h2>

      <pre><code>{`# JSON report
curl http://localhost:8000/api/v1/report/P00533

# PDF report
curl http://localhost:8000/api/v1/report/P00533/pdf -o report.pdf`}</code></pre>

      <p><Link href="/docs/sar-analysis">Next: SAR analysis &rarr;</Link></p>
    </>
  );
}
