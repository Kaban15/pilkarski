"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SparingForm } from "@/components/sparings/sparing-form";

export default function EditSparingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sparing, setSparing] = useState<any>(null);

  useEffect(() => {
    trpc.sparing.getById.query({ id }).then(setSparing);
  }, [id]);

  if (!sparing) return <DetailPageSkeleton />;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Sparingi", href: "/sparings" },
          { label: sparing.title, href: `/sparings/${id}` },
          { label: "Edycja" },
        ]}
      />
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Edytuj sparing</CardTitle>
        </CardHeader>
        <CardContent>
          <SparingForm
            mode="edit"
            defaultValues={{
              id,
              title: sparing.title,
              description: sparing.description,
              matchDate: sparing.matchDate,
              location: sparing.location,
              costSplitInfo: sparing.costSplitInfo,
              regionId: sparing.regionId,
            }}
            onSuccess={(sparingId) => router.push(`/sparings/${sparingId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
