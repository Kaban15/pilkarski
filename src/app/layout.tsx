import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "PilkaSport — Platforma dla klubów i zawodników",
    template: "%s | PilkaSport",
  },
  description:
    "Łączymy kluby piłkarskie z zawodnikami. Sparingi, nabory, treningi otwarte i wiele więcej.",
  openGraph: {
    title: "PilkaSport — Platforma dla klubów i zawodników",
    description:
      "Łączymy kluby piłkarskie z zawodnikami. Sparingi, nabory, treningi otwarte.",
    type: "website",
    locale: "pl_PL",
    siteName: "PilkaSport",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
