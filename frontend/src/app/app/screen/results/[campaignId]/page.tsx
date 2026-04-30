import ResultsClient from './ResultsClient';

export async function generateStaticParams() {
  // Static export needs at least one param; real campaign IDs are created at
  // runtime and resolved client-side via the same dynamic page.
  return [{ campaignId: 'placeholder' }];
}

export default function ScreenResultsPage() {
  return <ResultsClient />;
}
