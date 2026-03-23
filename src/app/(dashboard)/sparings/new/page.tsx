"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparingForm } from "@/components/sparings/sparing-form";

export default function NewSparingPage() {
  const router = useRouter();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nowy sparing</CardTitle>
      </CardHeader>
      <CardContent>
        <SparingForm
          mode="create"
          onSuccess={(id) => router.push(`/sparings/${id}`)}
        />
      </CardContent>
    </Card>
  );
}
