import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Liked stations",
  robots: { index: false, follow: false },
};

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
