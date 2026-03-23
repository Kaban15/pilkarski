"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationSkeleton } from "@/components/card-skeleton";
import { getUserDisplayName } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare, ArrowRight } from "lucide-react";

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    email: string;
    role: string;
    club: { name: string; logoUrl: string | null } | null;
    player: { firstName: string; lastName: string; photoUrl: string | null } | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  createdAt: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.message.getConversations
      .query()
      .then((data) => setConversations(data as any))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wiadomości</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Twoje konwersacje z klubami i zawodnikami
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ConversationSkeleton key={i} />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Brak konwersacji"
          description="Napisz wiadomość z profilu klubu lub strony sparingu aby rozpocząć konwersację."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const displayName = getUserDisplayName(conv.otherUser);
            const initial = displayName?.[0]?.toUpperCase() ?? "?";
            const isClub = conv.otherUser?.role === "CLUB";

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="group block">
                <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isClub
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                    }`}>
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </p>
                        {conv.lastMessage && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="truncate text-sm text-muted-foreground">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
