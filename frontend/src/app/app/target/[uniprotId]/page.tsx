import TargetOverviewClient from './TargetOverviewClient';

export async function generateStaticParams() {
  // Pre-generate EGFR (P00533) as the default showcase target
  return [{ uniprotId: 'P00533' }];
}

export default function TargetPage({ params }: { params: { uniprotId: string } }) {
  return <TargetOverviewClient />;
}
