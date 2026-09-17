import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const bulletin = JetBrains_Mono({
  variable: "--font-bulletin",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airwave — Internet Radio",
  description: "Browse and stream internet radio stations from around the world.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bulletin.variable} h-full antialiased`}>
      <body className="min-h-full h-full flex flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
