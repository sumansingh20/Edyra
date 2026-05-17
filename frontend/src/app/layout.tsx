import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'EDYRA — Learning Management System', template: '%s | EDYRA' },
  description: 'EDYRA is an enterprise LMS with secure online examinations, real-time classrooms, AI-powered learning, and deep analytics for modern educational institutions.',
  keywords: ['LMS','learning management system','online examination','enterprise education','EdTech','EDYRA'],
  authors: [{ name: 'EDYRA Team' }],
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://edyra.com', siteName: 'EDYRA',
    title: 'EDYRA — Learning Management System',
    description: 'Enterprise LMS with secure examinations and real-time classrooms.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f98012" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" storageKey="edyra-theme">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#3d3d3d',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
              success: { iconTheme: { primary: '#357a32', secondary: '#fff' } },
              error: { iconTheme: { primary: '#d9534f', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
