import type { MetadataRoute } from "next";
import { db } from "@/server/db/client";

const BASE_URL = "https://pilkasport.pl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/leagues`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const regions = await db.region.findMany({
      select: { slug: true },
    });

    for (const region of regions) {
      entries.push({
        url: `${BASE_URL}/leagues/${region.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const levels = await db.leagueLevel.findMany({
      select: { id: true, region: { select: { slug: true } } },
    });

    for (const level of levels) {
      entries.push({
        url: `${BASE_URL}/leagues/${level.region.slug}/${level.id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    const groups = await db.leagueGroup.findMany({
      select: {
        id: true,
        leagueLevel: {
          select: { id: true, region: { select: { slug: true } } },
        },
      },
    });

    for (const group of groups) {
      entries.push({
        url: `${BASE_URL}/leagues/${group.leagueLevel.region.slug}/${group.leagueLevel.id}/${group.id}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable at build time — return static entries only
  }

  return entries;
}
