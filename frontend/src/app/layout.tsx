import type { Metadata } from 'next';
import './globals.css';

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
        <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
            <a href="/" className="text-lg font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
              OpenDDE
            </a>
          </div>
        </nav>
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
