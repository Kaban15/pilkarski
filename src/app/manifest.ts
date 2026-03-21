import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PilkaSport",
    short_name: "PilkaSport",
    description:
      "Łączymy kluby piłkarskie z zawodnikami. Sparingi, nabory, treningi otwarte.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
