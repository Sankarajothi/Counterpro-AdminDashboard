import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CounterPro — Admin Console',
  description: 'Production Admin Console for CounterPro Billing & Retail System',
  icons: {
    icon: '/assets/counterpro-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}
