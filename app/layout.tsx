import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { AppWrapper } from '@/components/AppWrapper';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-interface',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-body',
});

export const viewport: Viewport = {
  themeColor: '#050508',
};

export const metadata: Metadata = {
  title: 'The Symbiosis Protocol',
  description: 'The Symbiosis Protocol (TSP)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TSP',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${cormorantGaramond.variable} ${dmMono.variable} ${instrumentSerif.variable}`}>
      <body className="bg-void text-signal font-body antialiased overflow-hidden" suppressHydrationWarning>
        <div className="mx-auto w-full max-w-[390px] h-[100dvh] relative overflow-hidden bg-void shadow-2xl sm:border sm:border-membrane sm:rounded-[40px] sm:h-[844px] sm:mt-8">
          <AppWrapper>
            {children}
          </AppWrapper>
        </div>
      </body>
    </html>
  );
}
