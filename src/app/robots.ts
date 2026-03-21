import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/feed", "/profile", "/sparings/new", "/events/new", "/messages", "/notifications"],
      },
    ],
    sitemap: "https://pilkasport.pl/sitemap.xml",
  };
}
