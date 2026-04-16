import CompareClient from './CompareClient';

export async function generateStaticParams() {
  // Pre-generate EGFR (P00533) comparison as the default showcase
  return [{ uniprotId: 'P00533' }];
}

export default function ComparePage() {
  return <CompareClient />;
}
