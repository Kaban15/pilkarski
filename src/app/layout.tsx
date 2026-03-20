import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "PilkaSport — Platforma dla klubów i zawodników",
  description:
    "Łączymy kluby piłkarskie z zawodnikami. Sparingi, nabory, treningi otwarte.",
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
