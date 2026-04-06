"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationSkeleton } from "@/components/card-skeleton";
import { getUserDisplayName, getProfileHref } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    email: string;
    role: string;
    club: { id: string; name: string; logoUrl: string | null } | null;
    player: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
    coach: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
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
  const { t } = useI18n();
  const router = useRouter();
  const { data: conversations = [] as Conversation[], isLoading: loading } = api.message.getConversations.useQuery(undefined, {
    select: (data) => data as unknown as Conversation[],
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Wiadomości")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Twoje konwersacje z klubami i zawodnikami")}
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
          title={t("Brak konwersacji")}
          description={t("Napisz wiadomość z profilu klubu lub strony sparingu aby rozpocząć konwersację.")}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const displayName = getUserDisplayName(conv.otherUser);
            const initial = displayName?.[0]?.toUpperCase() ?? "?";
            const isClub = conv.otherUser?.role === "CLUB";
            const profileHref = getProfileHref(conv.otherUser);

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="group block">
                <Card className="transition-all">
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
                        <p className="font-semibold truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {displayName}
                          {profileHref && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(profileHref); }}
                              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              title={t("Zobacz profil")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
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
