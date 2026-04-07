import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'OpenDDE — Open Drug Design Engine',
  description: 'Open-source drug design workbench',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <Navbar />
        <div className="pt-14">
          {/* Mobile notice */}
          <div className="block px-4 py-2 text-center text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 md:hidden">
            Desktop recommended for best experience
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
