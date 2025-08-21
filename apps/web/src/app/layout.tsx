import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
// @ts-ignore
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'NestJS Prisma Monorepo',
    template: '%s | NestJS Prisma Monorepo',
  },
  description:
    'Production-grade monorepo with Next.js frontend and NestJS backend',
  keywords: [
    'Next.js',
    'NestJS',
    'TypeScript',
    'Prisma',
    'Monorepo',
    'Turborepo',
    'TailwindCSS',
    'shadcn/ui',
  ],
  authors: [
    {
      name: 'Your Name',
    },
  ],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    title: 'NestJS Prisma Monorepo',
    description:
      'Production-grade monorepo with Next.js frontend and NestJS backend',
    siteName: 'NestJS Prisma Monorepo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NestJS Prisma Monorepo',
    description:
      'Production-grade monorepo with Next.js frontend and NestJS backend',
    creator: '@yourusername',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children} </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
