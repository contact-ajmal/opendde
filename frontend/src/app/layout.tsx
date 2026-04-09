import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import CommandPalette from '@/components/CommandPalette';
import AssistantProvider from '@/components/AssistantContext';
import AssistantDrawer from '@/components/AssistantDrawer';
import AssistantTrigger from '@/components/AssistantTrigger';

export const metadata: Metadata = {
  title: {
    default: 'OpenDDE — Open Drug Design Engine',
    template: '%s — OpenDDE',
  },
  description:
    'Open-source drug design workbench. Discover druggable pockets, explore known ligands, predict binding complexes with AlphaFold 3, P2Rank, and ImmuneBuilder.',
  openGraph: {
    title: 'OpenDDE — Open Drug Design Engine',
    description:
      'Self-hosted drug design platform: pocket discovery, ligand intelligence, complex prediction, and antibody modeling.',
    siteName: 'OpenDDE',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenDDE — Open Drug Design Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenDDE — Open Drug Design Engine',
    description:
      'Self-hosted drug design platform: pocket discovery, ligand intelligence, complex prediction, and antibody modeling.',
    images: ['/og-image.png'],
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'OpenDDE',
              alternateName: 'Open Drug Design Engine',
              description:
                'Open-source computational drug design platform for pocket discovery, ligand intelligence, complex prediction, and antibody modeling.',
              applicationCategory: 'ScientificApplication',
              operatingSystem: 'Docker (Linux, macOS, Windows)',
              license: 'https://opensource.org/licenses/MIT',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Person',
                name: 'Ajmal',
              },
            }),
          }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AssistantProvider>
            <Navbar />
            <CommandPalette />
            <AssistantDrawer />
            <AssistantTrigger />
            <div id="main-content" className="pt-14">
              {/* Mobile notice */}
              <div
                role="status"
                className="block px-4 py-2 text-center text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 md:hidden"
              >
                Desktop recommended for best experience
              </div>
              {children}
            </div>
          </AssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
