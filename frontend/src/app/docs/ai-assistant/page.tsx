import Link from 'next/link';

export const metadata = { title: 'AI Assistant', description: 'Claude-powered scientific assistant for drug design.' };

export default function AiAssistantPage() {
  return (
    <>
      <h1>AI assistant</h1>

      <p>
        OpenDDE includes an AI-powered scientific assistant built on <strong>Claude</strong> by
        Anthropic. The assistant provides expert interpretation of your drug design results,
        answers questions about targets, and suggests next steps.
      </p>

      <h2 id="capabilities">What the assistant can do</h2>

      <ul>
        <li><strong>Pocket analysis</strong> &mdash; Explain why a pocket is or isn&rsquo;t druggable,
          based on its residue composition, shape, and known literature</li>
        <li><strong>Ligand suggestions</strong> &mdash; Propose chemical modifications to improve
          binding affinity or drug-likeness</li>
        <li><strong>Target context</strong> &mdash; Provide background on the biological role of
          a protein, its disease associations, and therapeutic relevance</li>
        <li><strong>Result interpretation</strong> &mdash; Help you understand confidence scores,
          activity data, and structural predictions</li>
      </ul>

      <h2 id="setup">Setup</h2>

      <p>
        The AI assistant requires an Anthropic API key. Add it to your <code>.env</code> file:
      </p>

      <pre><code>{`ANTHROPIC_API_KEY=sk-ant-api03-...`}</code></pre>

      <p>
        Without an API key, the assistant panel will be hidden but all other features work normally.
      </p>

      <h2 id="usage">Using the assistant</h2>

      <p>
        The assistant appears as a slide-out drawer on target and pocket pages. Click the assistant
        icon to open it, then type your question. The assistant has full context about the current
        target, its pockets, and known ligands.
      </p>

      <h2 id="auto-analyses">Automatic analyses</h2>

      <p>
        The assistant also provides two automatic analyses (cached per pocket):
      </p>

      <ul>
        <li><strong>Pocket summary</strong> &mdash; A one-paragraph druggability assessment that
          appears on each pocket&rsquo;s detail page</li>
        <li><strong>Ligand suggestions</strong> &mdash; Three suggested molecular modifications
          tailored to the pocket&rsquo;s chemical environment</li>
      </ul>

      <p><Link href="/docs/druglikeness-scoring">Next: Druglikeness scoring &rarr;</Link></p>
    </>
  );
}
