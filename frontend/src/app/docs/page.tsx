import Link from 'next/link';

export const metadata = { title: 'Introduction' };

export default function DocsIntroduction() {
  return (
    <>
      <h1>Welcome to OpenDDE</h1>

      <p>
        OpenDDE is an open-source computational drug design platform that helps researchers explore
        protein drug targets, discover druggable binding pockets, analyze known compounds, and predict
        molecular interactions.
      </p>

      <h2 id="what-can-you-do">What can you do with OpenDDE?</h2>

      <ul>
        <li>
          <strong>Discover binding pockets</strong> &mdash; Enter any protein and instantly see
          predicted druggable pockets ranked by machine learning (P2Rank)
        </li>
        <li>
          <strong>Explore known drugs</strong> &mdash; Browse all known bioactive compounds from
          ChEMBL with experimental binding data
        </li>
        <li>
          <strong>Predict complexes</strong> &mdash; Use AlphaFold 3 to predict how drugs bind to
          targets
        </li>
        <li>
          <strong>Analyze antibodies</strong> &mdash; Predict antibody structures with CDR loop
          annotation using ImmuneBuilder
        </li>
        <li>
          <strong>AI-powered insights</strong> &mdash; Get expert interpretation of your results
          from Claude AI
        </li>
      </ul>

      <h2 id="who-is-this-for">Who is this for?</h2>

      <p>OpenDDE is designed for:</p>

      <ul>
        <li><strong>Academic researchers</strong> exploring new drug targets</li>
        <li><strong>Pharmaceutical scientists</strong> screening targets computationally</li>
        <li><strong>Students</strong> learning drug design concepts</li>
        <li><strong>Biotech startups</strong> needing professional target assessment</li>
      </ul>

      <h2 id="technology">Technology</h2>

      <p>
        OpenDDE runs entirely in Docker Compose on your local machine. It integrates six
        microservices into a single platform:
      </p>

      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>AlphaFold 3</td><td>Structure prediction &amp; complex modeling</td></tr>
          <tr><td>P2Rank</td><td>ML-based binding pocket detection</td></tr>
          <tr><td>ChEMBL</td><td>Bioactivity data for known compounds</td></tr>
          <tr><td>RDKit</td><td>Cheminformatics &amp; molecular properties</td></tr>
          <tr><td>ImmuneBuilder</td><td>Antibody structure prediction</td></tr>
          <tr><td>Claude AI</td><td>Scientific reasoning &amp; analysis</td></tr>
        </tbody>
      </table>

      <h2 id="next-steps">Next steps</h2>

      <p>
        Ready to get started? Follow the{' '}
        <Link href="/docs/quick-start">Quick start guide</Link> to have OpenDDE running in under 5
        minutes.
      </p>
    </>
  );
}
