"use client";

import { useState } from "react";
import Link from "next/link";

interface RegionData {
  slug: string;
  name: string;
  clubCount: number;
}

interface PolandMapProps {
  regions: RegionData[];
}

// Simplified but recognizable SVG paths for Polish voivodeships
// viewBox coordinates roughly match geographic positions
const VOIVODESHIP_PATHS: Record<string, string> = {
  "zachodniopomorski-zpn": "M60,20 L100,15 L120,30 L115,55 L100,70 L80,80 L50,75 L35,60 L40,35 Z",
  "pomorski-zpn": "M120,30 L160,20 L180,25 L185,50 L170,65 L140,70 L115,55 Z",
  "warminsko-mazurski-zpn": "M185,50 L220,35 L260,40 L270,55 L265,75 L235,80 L200,75 L185,65 Z",
  "podlaski-zpn": "M265,75 L290,60 L310,75 L305,110 L295,135 L270,130 L255,110 L255,85 Z",
  "lubuski-zpn": "M35,60 L50,75 L65,95 L60,120 L50,135 L30,130 L20,110 L25,80 Z",
  "wielkopolski-zpn": "M65,95 L100,70 L140,70 L155,85 L150,115 L135,135 L110,145 L80,140 L60,120 Z",
  "kujawsko-pomorski-zpn": "M140,70 L170,65 L200,75 L195,95 L175,105 L155,100 L155,85 Z",
  "mazowiecki-zpn": "M195,95 L235,80 L255,85 L255,110 L260,130 L240,155 L210,160 L185,145 L175,120 L175,105 Z",
  "lodzki-zpn": "M135,135 L175,120 L185,145 L180,170 L160,180 L135,175 L120,160 Z",
  "dolnoslaski-zpn": "M30,130 L60,120 L80,140 L90,160 L80,185 L55,190 L35,180 L25,155 Z",
  "opolski-zpn": "M80,140 L110,145 L120,160 L115,180 L95,185 L80,185 L80,160 Z",
  "slaski-zpn": "M115,180 L135,175 L150,185 L145,210 L125,215 L110,205 L95,195 L95,185 Z",
  "swietokrzyski-zpn": "M180,170 L210,160 L225,175 L215,200 L195,205 L180,195 Z",
  "lubelski-zpn": "M240,155 L270,130 L295,135 L300,165 L290,200 L265,215 L240,210 L225,190 L225,175 L240,165 Z",
  "malopolski-zpn": "M145,210 L180,195 L215,200 L225,215 L210,240 L175,245 L150,235 L140,220 Z",
  "podkarpacki-zpn": "M225,215 L265,215 L290,200 L300,220 L290,245 L260,255 L230,250 L210,240 Z",
};

export function PolandMap({ regions }: PolandMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const regionMap = new Map(regions.map((r) => [r.slug, r]));

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-violet-500/5 blur-[60px]" />

      <svg
        viewBox="10 10 300 250"
        className="w-full drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(VOIVODESHIP_PATHS).map(([slug, path]) => {
          const region = regionMap.get(slug);
          const isHovered = hovered === slug;

          return (
            <Link key={slug} href={`/leagues/${slug}`}>
              <path
                d={path}
                className={`cursor-pointer transition-all duration-200 ${
                  isHovered
                    ? "fill-violet-500/25 stroke-violet-400"
                    : "fill-card stroke-border hover:fill-violet-500/15 hover:stroke-violet-400/60"
                }`}
                strokeWidth={isHovered ? "2" : "1.5"}
                strokeLinejoin="round"
                onMouseEnter={() => setHovered(slug)}
                onMouseLeave={() => setHovered(null)}
              />
            </Link>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && regionMap.get(hovered) && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 rounded-lg border border-violet-500/20 bg-card px-3 py-1.5 text-center shadow-lg">
          <p className="text-[13px] font-semibold">{regionMap.get(hovered)!.name}</p>
          <p className="text-[11px] text-muted-foreground">{regionMap.get(hovered)!.clubCount} klubów</p>
        </div>
      )}
    </div>
  );
}
