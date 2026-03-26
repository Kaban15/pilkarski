"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatShortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  CLUB_POST_CATEGORY_LABELS,
  CLUB_POST_CATEGORY_COLORS,
} from "@/lib/labels";
import type { ClubPostCategoryValue } from "@/lib/validators/club-post";
import { createClubPostSchema } from "@/lib/validators/club-post";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Plus, Trash2, Megaphone, Flag } from "lucide-react";

type CategoryFilter = ClubPostCategoryValue | "ALL";

export default function CommunityPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const utils = api.useUtils();

  const { data, isLoading } = api.clubPost.list.useQuery({
    category: category === "ALL" ? undefined : category,
  });

  const createMut = api.clubPost.create.useMutation({
    onSuccess: () => {
      toast.success("Post dodany");
      setShowForm(false);
      utils.clubPost.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Nie udało się dodać postu"),
  });

  const reportMut = api.clubPost.report.useMutation({
    onSuccess: () => {
      toast.success("Zgłoszenie wysłane");
      setReportingPostId(null);
      setReportReason("");
    },
    onError: (err) => toast.error(err.message || "Nie udało się wysłać zgłoszenia"),
  });

  const deleteMut = api.clubPost.delete.useMutation({
    onSuccess: () => {
      toast.success("Post usunięty");
      utils.clubPost.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Nie udało się usunąć postu"),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      category: fd.get("category") as string,
      title: fd.get("title") as string,
      content: (fd.get("content") as string) || undefined,
      expiresAt: (fd.get("expiresAt") as string) || undefined,
    };
    const validation = createClubPostSchema.safeParse(payload);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      return;
    }
    createMut.mutate(validation.data);
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tablica społeczności</h1>
          <p className="text-sm text-muted-foreground">
            Ogłoszenia klubowe, wyniki meczów i szukanie zawodników
          </p>
        </div>
        {isClub && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj post
          </Button>
        )}
      </div>

      {showForm && isClub && (
        <Card>
          <CardHeader>
            <CardTitle>Nowy post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  >
                    {Object.entries(CLUB_POST_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Wygasa (opcjonalnie)</Label>
                  <Input id="expiresAt" name="expiresAt" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="np. Szukamy bramkarza na sezon 2026/27"
                  className={fieldErrors.title ? "border-destructive" : ""}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive">{fieldErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Treść</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={3}
                  placeholder="Szczegóły ogłoszenia..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? "Publikowanie..." : "Opublikuj"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">Wszystkie</TabsTrigger>
          {Object.entries(CLUB_POST_CATEGORY_LABELS).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Brak postów"
          description="Nie ma jeszcze żadnych postów w tej kategorii."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      CLUB_POST_CATEGORY_COLORS[post.category] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {CLUB_POST_CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  {post.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      do {formatShortDate(post.expiresAt)}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 font-semibold leading-tight">{post.title}</h3>
                {post.content && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                    {post.content}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.club.logoUrl && (
                      <img
                        src={post.club.logoUrl}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium">{post.club.name}</span>
                    {post.club.city && <span>· {post.club.city}</span>}
                  </div>
                  {isClub && session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMut.mutate({ id: post.id })}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    {formatShortDate(post.createdAt)}
                  </p>
                  {session && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => setReportingPostId(reportingPostId === post.id ? null : post.id)}
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {reportingPostId === post.id && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Powód zgłoszenia..."
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 shrink-0"
                      disabled={reportReason.length < 5 || reportMut.isPending}
                      onClick={() => reportMut.mutate({ postId: post.id, reason: reportReason })}
                    >
                      Zgłoś
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
