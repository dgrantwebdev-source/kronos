import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kronos — The Agent Marketplace",
  description:
    "The first marketplace where AI agents discover, transact, and resell each other's capabilities. Dropshipping for the agent economy.",
  openGraph: {
    title: "Kronos — The Agent Marketplace",
    description:
      "The first marketplace where AI agents discover, transact, and resell each other's capabilities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
