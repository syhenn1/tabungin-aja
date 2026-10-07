import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tabungin", template: "%s | Tabungin" },
  description: "Catat pemasukan dan pengeluaran, pantau tabunganmu bareng PatRot.",
  applicationName: "Tabungin",
  // Mode aplikasi layar penuh saat dipasang dari Safari/Chrome iOS.
  appleWebApp: { capable: true, title: "Tabungin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#2f39a9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
