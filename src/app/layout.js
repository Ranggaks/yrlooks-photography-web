import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  // 1. Judul Tab Browser Utama
  title: 'YRLOOKS Photography — Luxury Wedding & Studio Portfolio',

  // 2. Deskripsi untuk Mesin Pencari (Google)
  description:
    'Authentic moments & timeless stories. Layanan fotografi profesional untuk Wedding, Pre-Wedding, dan Studio.',

  // 3. Kata Kunci SEO
  keywords: [
    'YRLOOKS Photography',
    'Fotografer Wedding Depok',
    'Fotografer Wedding Jakarta',
    'Prewedding Shoot',
    'Studio Photography',
    'Fotografer Pernikahan',
  ],

  // 4. Favicon (Menggunakan logo.png yang ada di folder public)
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },

  // 5. Open Graph (Tampilan Preview saat link dibagikan ke WhatsApp / Sosmed)
  openGraph: {
    title: 'YRLOOKS Photography — Luxury Wedding & Studio Portfolio',
    description:
      'Capturing authentic moments & timeless stories. Pilih paket fotografi dan ajukan quote resmi untuk acara spesial Anda.',
    url: 'https://yrlooksphotography.com',
    siteName: 'YRLOOKS Photography',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'YRLOOKS Photography Portfolio Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}