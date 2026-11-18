import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROTAEX | Entregas Inteligentes',
  description: 'Organize suas entregas em tempo real pela menor distância GPS.',
  icons: {
    icon: '/logo-rotaex.png',
    shortcut: '/logo-rotaex.png',
    apple: '/logo-rotaex.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ROTAEX',
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#050505] text-white antialiased">{children}</body>
    </html>
  );
}