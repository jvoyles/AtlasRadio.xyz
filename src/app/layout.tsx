import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Airwave — Internet Radio",
  description: "Browse and stream internet radio stations from around the world.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0a0e17",
};

// Rendering per request lets Next.js stamp the CSP nonce from src/proxy.ts on
// its scripts and styles.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
