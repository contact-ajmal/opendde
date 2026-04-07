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
        {children}
      </body>
    </html>
  );
}
