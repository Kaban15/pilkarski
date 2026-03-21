"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { getUserDisplayName } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Load messages and extract other user info from first message
    trpc.message.getMessages
      .query({ conversationId })
      .then((data) => {
        const items = data.items as Message[];
        setMessages(items);
        if (items.length > 0) {
          lastMessageIdRef.current = items[items.length - 1].id;
        }
      })
      .finally(() => setLoading(false));

    // Mark as read
    trpc.message.markAsRead.mutate({ conversationId });

    // Get other user info from conversations list
    trpc.message.getConversations.query().then((convs: any[]) => {
      const conv = convs.find((c: any) => c.id === conversationId);
      if (conv?.otherUser) {
        setOtherUserId(conv.otherUser.id);
        setOtherUserName(getUserDisplayName(conv.otherUser));
      }
    });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId) return;

    setSending(true);
    try {
      const result = await trpc.message.send.mutate({
        recipientUserId: otherUserId,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, result.message as any]);
      setNewMessage("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const data = await trpc.message.getMessages.query({ conversationId });
        const items = data.items as Message[];
        const newLastId = items.length > 0 ? items[items.length - 1].id : null;

        // Only update state and mark as read if there are new messages
        if (newLastId !== lastMessageIdRef.current) {
          setMessages(items);
          lastMessageIdRef.current = newLastId;
          await trpc.message.markAsRead.mutate({ conversationId });
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/messages")}>
          &larr;
        </Button>
        <h1 className="text-lg font-semibold">{otherUserName || "Konwersacja"}</h1>
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
          <p className="text-center text-gray-400">Brak wiadomości. Napisz pierwszą!</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId !== otherUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwn ? "text-blue-200" : "text-gray-400"
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
      <form onSubmit={handleSend} className="border-t px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            maxLength={2000}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? "..." : "Wyślij"}
          </Button>
        </div>
      </form>
    </div>
  );
}
