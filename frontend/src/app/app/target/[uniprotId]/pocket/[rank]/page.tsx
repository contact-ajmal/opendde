import TargetPocketClient from './TargetPocketClient';

export async function generateStaticParams() {
  // Pre-generate EGFR (P00533) Pocket 1 as the default showcase pocket
  return [{ uniprotId: 'P00533', rank: '1' }];
}

export default function PocketPage() {
  return <TargetPocketClient />;
}
