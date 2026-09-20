import type { Metadata } from "next";
import BrowsePage from "@/components/BrowsePage";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const { q, section } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 80);
  if (query) return { title: `Results for “${query}” — Airwave` };
  if (section === "trending") return { title: "Trending stations — Airwave" };
  return { title: "Airwave — Live radio from around the world" };
}

export default function Page() {
  return <BrowsePage />;
}
