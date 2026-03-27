import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ArrowLeft, Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Struktura ligowa",
  description: "Przeglądaj drużyny według struktury ligowej — województwa, szczeble, grupy.",
};

export default async function LeaguesPage() {
  const regions = await db.region.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clubs: true } } },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          PilkaSport
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Struktura ligowa</h1>
          <p className="mt-1 text-muted-foreground">
            Wybierz województwo, aby przeglądać szczeble i grupy ligowe.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/leagues/${region.slug}`}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="font-medium">{region.name}</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {region._count.clubs}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
