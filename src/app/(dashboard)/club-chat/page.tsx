"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { getUserDisplayName } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function ClubChatPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = api.message.getClubChat.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  const utils = api.useUtils();
  const sendMessage = api.message.sendToClubChat.useMutation({
    onSuccess: () => {
      setMessage("");
      void utils.message.getClubChat.invalidate();
    },
  });

  const lastMessageId = data?.messages?.[data.messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !data?.conversationId) return;
    sendMessage.mutate({
      conversationId: data.conversationId,
      content: trimmed,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <EmptyState
          icon={MessageSquare}
          title={t("Brak klubu")}
          description={t("Dołącz do klubu, aby korzystać z czatu grupowego")}
          actionLabel={t("Szukaj klubu")}
          actionHref="/search"
        />
      </div>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.6)*2)] flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {data.club.logoUrl ? (
            <Image
              src={data.club.logoUrl}
              alt={data.club.name ?? t("Klub")}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
              {(data.club.name ?? "K").charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-semibold">{data.club.name}</h1>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {data.memberCount} {t("członków")}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {data.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              {t("Brak wiadomości. Napisz pierwszą!")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.messages.map((msg) => {
              const isOwn = msg.sender?.id === currentUserId;
              const senderName = getUserDisplayName(msg.sender);
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%]">
                    {!isOwn && (
                      <p className="mb-0.5 text-xs font-medium text-violet-400">
                        {senderName}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? "rounded-br-md bg-violet-500 text-white"
                          : "rounded-bl-md border bg-card text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.content}
                      </p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isOwn
                            ? "text-white/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("Napisz wiadomość...")}
            maxLength={2000}
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={sendMessage.isPending || !message.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
