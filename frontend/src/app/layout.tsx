import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import CommandPalette from '@/components/CommandPalette';
import AssistantProvider from '@/components/AssistantContext';
import AssistantDrawer from '@/components/AssistantDrawer';
import AssistantTrigger from '@/components/AssistantTrigger';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <ThemeProvider>
          <AssistantProvider>
            <Navbar />
            <CommandPalette />
            <AssistantDrawer />
            <AssistantTrigger />
            <div className="pt-14">
              {/* Mobile notice */}
              <div className="block px-4 py-2 text-center text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 md:hidden">
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
