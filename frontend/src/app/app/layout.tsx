import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'App — OpenDDE',
    template: '%s — OpenDDE',
  },
  description:
    'Explore protein targets, discover druggable pockets, analyze ligands, and predict molecular complexes.',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
