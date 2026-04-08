import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
  variable: "--font-rubik",
});

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
    <html lang="pl" className={`${inter.variable} ${rubik.variable} ${inter.className}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
