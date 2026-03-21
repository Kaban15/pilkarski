"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EVENT_TYPE_LABELS, POSITION_LABELS } from "@/lib/labels";

type FeedItem = {
  type: "sparing" | "event" | "club" | "player";
  data: any;
  createdAt: string;
};

function FeedCard({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "sparing":
      return (
        <Link href={`/sparings/${item.data.id}`}>
          <Card className="transition hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">Sparing</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="font-semibold">{item.data.title}</p>
              <p className="text-sm text-gray-600">
                {item.data.club.name}{item.data.club.city && ` · ${item.data.club.city}`}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(item.data.matchDate)}{item.data.location && ` · ${item.data.location}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      );

    case "event":
      return (
        <Link href={`/events/${item.data.id}`}>
          <Card className="transition hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
                  {EVENT_TYPE_LABELS[item.data.type] ?? "Wydarzenie"}
                </span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="font-semibold">{item.data.title}</p>
              <p className="text-sm text-gray-600">
                {item.data.club.name}{item.data.club.city && ` · ${item.data.club.city}`}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(item.data.eventDate)}{item.data.location && ` · ${item.data.location}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      );

    case "club":
      return (
        <Link href={`/clubs/${item.data.id}`}>
          <Card className="transition hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">Nowy klub</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="font-semibold">{item.data.name}</p>
              <p className="text-sm text-gray-500">
                {item.data.city ?? ""}{item.data.region ? ` · ${item.data.region.name}` : ""}
              </p>
            </CardContent>
          </Card>
        </Link>
      );

    case "player":
      return (
        <Link href={`/players/${item.data.id}`}>
          <Card className="transition hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">Nowy zawodnik</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="font-semibold">
                {item.data.firstName} {item.data.lastName}
                {item.data.primaryPosition && (
                  <span className="ml-2 text-xs text-gray-500">
                    {POSITION_LABELS[item.data.primaryPosition] ?? item.data.primaryPosition}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {item.data.city ?? ""}{item.data.region ? ` · ${item.data.region.name}` : ""}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
  }
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.feed.get
      .query({ limit: 30 })
      .then((data) => {
        setItems(data.items as any);
        setRegionName(data.regionName);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        {regionName && (
          <p className="text-sm text-gray-500">Aktywności z regionu: {regionName}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Brak aktywności w Twoim regionie. Uzupełnij profil, aby zobaczyć dopasowane treści.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <FeedCard key={`${item.type}-${item.data.id}-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
