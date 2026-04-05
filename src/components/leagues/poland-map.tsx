"use client";

import Link from "next/link";
import Image from "next/image";

interface RegionData {
  slug: string;
  name: string;
  clubCount: number;
  levelCount: number;
}

interface PolandMapProps {
  regions: RegionData[];
}

// Approximate grid positions for Polish voivodeships (row, col) on a 4x5 grid
const GRID_POSITIONS: Record<string, [number, number]> = {
  "zachodniopomorski-zpn": [0, 0],
  "pomorski-zpn": [0, 1],
  "warminsko-mazurski-zpn": [0, 2],
  "podlaski-zpn": [0, 3],
  "lubuski-zpn": [1, 0],
  "wielkopolski-zpn": [1, 1],
  "kujawsko-pomorski-zpn": [1, 2],
  "mazowiecki-zpn": [1, 3],
  "dolnoslaski-zpn": [2, 0],
  "opolski-zpn": [2, 1],
  "lodzki-zpn": [2, 2],
  "lubelski-zpn": [2, 3],
  "slaski-zpn": [3, 1],
  "swietokrzyski-zpn": [3, 2],
  "malopolski-zpn": [3, 1],
  "podkarpacki-zpn": [3, 3],
};

// Short names for the grid tiles
const SHORT_NAMES: Record<string, string> = {
  "zachodniopomorski-zpn": "Zachodnio-\npomorskie",
  "pomorski-zpn": "Pomorskie",
  "warminsko-mazurski-zpn": "Warmińsko-\nMazurskie",
  "podlaski-zpn": "Podlaskie",
  "lubuski-zpn": "Lubuskie",
  "wielkopolski-zpn": "Wielkopolskie",
  "kujawsko-pomorski-zpn": "Kujawsko-\nPomorskie",
  "mazowiecki-zpn": "Mazowieckie",
  "dolnoslaski-zpn": "Dolnośląskie",
  "opolski-zpn": "Opolskie",
  "lodzki-zpn": "Łódzkie",
  "lubelski-zpn": "Lubelskie",
  "slaski-zpn": "Śląskie",
  "swietokrzyski-zpn": "Święto-\nkrzyskie",
  "malopolski-zpn": "Małopolskie",
  "podkarpacki-zpn": "Podkarpackie",
};

export function PolandMap({ regions }: PolandMapProps) {
  const regionMap = new Map(regions.map((r) => [r.slug, r]));

  // Build a 4x4 grid with proper geographic layout
  const rows = [
    ["zachodniopomorski-zpn", "pomorski-zpn", "warminsko-mazurski-zpn", "podlaski-zpn"],
    ["lubuski-zpn", "wielkopolski-zpn", "kujawsko-pomorski-zpn", "mazowiecki-zpn"],
    ["dolnoslaski-zpn", "opolski-zpn", "lodzki-zpn", "lubelski-zpn"],
    ["", "slaski-zpn", "swietokrzyski-zpn", "podkarpacki-zpn"],
  ];

  // Row 4 has Małopolskie between Śląskie and Świętokrzyskie
  const lastRow = ["malopolski-zpn", "slaski-zpn", "swietokrzyski-zpn", "podkarpacki-zpn"];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid grid-cols-4 gap-1.5">
        {[...rows.slice(0, 3), lastRow].map((row, rowIdx) =>
          row.map((slug, colIdx) => {
            if (!slug) {
              return <div key={`empty-${rowIdx}-${colIdx}`} />;
            }
            const region = regionMap.get(slug);
            if (!region) return <div key={slug} />;

            const shortName = SHORT_NAMES[slug] ?? region.name.replace(" ZPN", "");

            return (
              <Link
                key={slug}
                href={`/leagues/${slug}`}
                className="group relative flex flex-col items-center justify-center rounded-lg border border-border/50 bg-card/50 px-2 py-4 text-center transition-all duration-200 hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
              >
                <Image
                  src={`/regions/${slug}.png`}
                  alt={shortName}
                  width={28}
                  height={28}
                  className="mb-1.5"
                  style={{ objectFit: "contain" }}
                />
                <p className="whitespace-pre-line text-[11px] font-semibold leading-tight group-hover:text-violet-300">
                  {shortName}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {region.clubCount > 0 ? `${region.clubCount} kl.` : `${region.levelCount} lig`}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
