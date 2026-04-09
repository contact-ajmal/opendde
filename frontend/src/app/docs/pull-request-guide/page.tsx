import Link from 'next/link';

export const metadata = { title: 'Pull Request Guide', description: 'Contributing guidelines and PR process for OpenDDE.' };

export default function PullRequestGuidePage() {
  return (
    <>
      <h1>Pull request guide</h1>

      <p>
        Thank you for contributing to OpenDDE! This guide covers how to submit a pull request.
      </p>

      <h2 id="before-you-start">Before you start</h2>

      <ol>
        <li>Check the issue tracker for existing issues or feature requests</li>
        <li>For large changes, open an issue first to discuss your approach</li>
        <li>Fork the repository and create a feature branch</li>
      </ol>

      <h2 id="branch-naming">Branch naming</h2>

      <p>Use descriptive branch names:</p>

      <pre><code>{`feat/pocket-comparison-view
fix/ligand-table-sorting
docs/api-reference-update
refactor/engine-adapter-pattern`}</code></pre>

      <h2 id="commit-messages">Commit messages</h2>

      <p>Follow conventional commit format:</p>

      <pre><code>{`feat: add pocket comparison view
fix: correct ligand table sorting by activity
docs: update API reference with new endpoints
refactor: extract engine adapter base class`}</code></pre>

      <h2 id="pr-checklist">PR checklist</h2>

      <ul>
        <li>Code compiles without errors (<code>docker compose up --build</code> succeeds)</li>
        <li>New features have appropriate error handling</li>
        <li>API changes are documented in the API reference</li>
        <li>No secrets or API keys are committed</li>
        <li>UI changes are responsive (tested at mobile and desktop widths)</li>
      </ul>

      <h2 id="review-process">Review process</h2>

      <ol>
        <li>Submit your PR with a clear description of the change and why</li>
        <li>A maintainer will review within 48 hours</li>
        <li>Address any feedback and push additional commits</li>
        <li>Once approved, the PR will be squash-merged into main</li>
      </ol>

      <h2 id="areas">Good areas to contribute</h2>

      <ul>
        <li><strong>New engines</strong> &mdash; Integrate additional computational tools</li>
        <li><strong>Visualization</strong> &mdash; Improve 3D viewer features or charts</li>
        <li><strong>Documentation</strong> &mdash; Expand guides, add tutorials</li>
        <li><strong>Testing</strong> &mdash; Add unit and integration tests</li>
        <li><strong>Accessibility</strong> &mdash; Improve keyboard navigation and screen reader support</li>
      </ul>

      <p><Link href="/docs">Back to introduction &rarr;</Link></p>
    </>
  );
}
