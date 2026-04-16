import ReportClient from './ReportClient';

export async function generateStaticParams() {
  // Pre-generate EGFR (P00533) report as the default showcase
  return [{ uniprotId: 'P00533' }];
}

export default function ReportPage() {
  return <ReportClient />;
}
