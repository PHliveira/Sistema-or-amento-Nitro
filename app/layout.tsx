import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Nitro Orçamentos | Confecção Têxtil & Uniformes',
  description:
    'Sistema de precificação e geração de orçamentos para confecção têxtil com visão interna de custos, visão externa para vendedores/clientes, motores de estamparia e integração com Google Sheets.',
  icons: {
    icon: '/assets/aistudio/nitro_logo_b66efb2c.png',
    shortcut: '/assets/aistudio/nitro_logo_b66efb2c.png',
    apple: '/assets/aistudio/nitro_logo_b66efb2c.png',
  },
  openGraph: {
    title: 'Nitro Orçamentos | Confecção Têxtil & Uniformes',
    description:
      'Sistema de precificação e geração de orçamentos para confecção têxtil com visão interna de custos, visão externa para vendedores/clientes, motores de estamparia e integração com Google Sheets.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nitro Orçamentos | Confecção Têxtil & Uniformes',
    description:
      'Sistema de precificação e geração de orçamentos para confecção têxtil com visão interna de custos, visão externa para vendedores/clientes, motores de estamparia e integração com Google Sheets.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('nitro_theme', 'light');
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className="bg-[var(--bg-fundo)] text-[var(--texto-primario)] min-h-screen font-sans antialiased selection:bg-[#ff8300] selection:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
