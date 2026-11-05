import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Counter365 — Admin Console',
  description: 'Production Admin Console for Counter365 Billing & Retail System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F3F0] text-[#1E293B] antialiased selection:bg-[#FFEDD5] selection:text-[#C2410C]">
        {children}
      </body>
    </html>
  );
}
