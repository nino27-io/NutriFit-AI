import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ViewTransitionHandler } from '@/components/ViewTransitionHandler';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'NutriFit AI — Analisis Tubuh & Rencana Gizi Personal',
  description:
    'Analisis komposisi tubuh (BMI, WHR, Lemak Tubuh US Navy), kebutuhan kalori harian, menu makan sesuai budget, dan jadwal olahraga.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="flex min-h-screen flex-col bg-[#EEF5FC] font-sans text-[#0B2545] antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}