"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import { getUserDisplayName, getProfileHref } from "@/lib/labels";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string | Date;
  sender: {
    id: string;
    email: string;
    role: string;
    club: { name: string } | null;
    player: { firstName: string; lastName: string } | null;
  };
};

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: messagesData, isLoading: loading } = api.message.getMessages.useQuery(
    { conversationId },
    {
      enabled: !!conversationId,
      refetchInterval: 30_000,
    }
  );

  const markAsReadMut = api.message.markAsRead.useMutation();

  const { data: convs } = api.message.getConversations.useQuery(undefined, {
    enabled: !!conversationId,
  });

  // Sync messages data from query to local state
  useEffect(() => {
    if (!messagesData) return;
    const items = (messagesData as { items: Message[] }).items;
    const newLastId = items.length > 0 ? items[items.length - 1].id : null;
    if (newLastId !== lastMessageIdRef.current) {
      setMessages(items);
      lastMessageIdRef.current = newLastId;
      if (conversationId) markAsReadMut.mutate({ conversationId });
    }
  }, [messagesData]);

  useEffect(() => {
    if (!conversationId) return;
    markAsReadMut.mutate({ conversationId });
  }, [conversationId]);

  useEffect(() => {
    if (!convs || !conversationId) return;
    const conv = (convs as unknown as { id: string; otherUser: { id: string; role?: string; email?: string; club?: { id: string; name: string } | null; player?: { id: string; firstName: string; lastName: string } | null; coach?: { id: string; firstName: string; lastName: string } | null } | null }[]).find((c) => c.id === conversationId);
    if (conv?.otherUser) {
      setOtherUserId(conv.otherUser.id);
      setOtherUserName(getUserDisplayName(conv.otherUser));
    }
  }, [convs, conversationId]);

  const otherUserProfileHref = (() => {
    if (!convs || !conversationId) return null;
    const conv = (convs as unknown as { id: string; otherUser: { role?: string; club?: { id: string } | null; player?: { id: string } | null; coach?: { id: string } | null } | null }[]).find((c) => c.id === conversationId);
    return conv?.otherUser ? getProfileHref(conv.otherUser) : null;
  })();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        const msg = payload as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          lastMessageIdRef.current = msg.id;
          return [...prev, msg];
        });
        markAsReadMut.mutate({ conversationId });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMut = api.message.send.useMutation({
    onSuccess: (result) => {
      setMessages((prev) => [...prev, result.message as unknown as Message]);
      setNewMessage("");
      channelRef.current?.send({
        type: "broadcast",
        event: "new_message",
        payload: result.message,
      });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId) return;
    sendMut.mutate({ recipientUserId: otherUserId, content: newMessage.trim() });
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.6)*2)] flex-col overflow-hidden rounded-xl border border-border bg-card md:h-[calc(100vh-theme(spacing.6)*2)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/messages")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {otherUserName?.[0]?.toUpperCase() ?? "?"}
          </div>
          {otherUserProfileHref ? (
            <Link href={otherUserProfileHref} className="font-semibold hover:underline hover:text-primary transition-colors">
              {otherUserName || "Konwersacja"}
            </Link>
          ) : (
            <h1 className="font-semibold">{otherUserName || "Konwersacja"}</h1>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className="h-12 w-[60%] rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              Brak wiadomości. Napisz pierwszą!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isOwn = msg.senderId !== otherUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-secondary text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            maxLength={2000}
            disabled={sendMut.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={sendMut.isPending || !newMessage.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
