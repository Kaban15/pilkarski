"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationSkeleton } from "@/components/card-skeleton";
import { getUserDisplayName } from "@/lib/labels";

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
    <div>
      <h1 className="mb-6 text-2xl font-bold">Wiadomości</h1>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ConversationSkeleton key={i} />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-muted-foreground">
          Brak konwersacji. Napisz wiadomość z profilu klubu lub zawodnika.
        </p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/messages/${conv.id}`}>
              <Card className="transition hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {getUserDisplayName(conv.otherUser)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {getUserDisplayName(conv.otherUser)}
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
