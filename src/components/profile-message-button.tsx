"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";

interface ProfileMessageButtonProps {
  recipientUserId: string;
}

export function ProfileMessageButton({ recipientUserId }: ProfileMessageButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const send = api.message.send.useMutation({
    onSuccess: (result) => {
      router.push(`/messages/${result.conversationId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (status !== "authenticated" || !session?.user?.id) return null;
  if (session.user.id === recipientUserId) return null;

  function handleSend() {
    if (!message.trim()) return;
    send.mutate({ recipientUserId, content: message.trim() });
  }

  if (!open) {
    return (
      <Button
        size="sm"
        className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Napisz wiadomość
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Napisz wiadomość..."
        maxLength={2000}
        className="h-8 border-white/20 bg-white/10 text-white placeholder:text-white/50"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button
        onClick={handleSend}
        disabled={send.isPending || !message.trim()}
        size="sm"
        className="bg-white/20 text-white hover:bg-white/30"
      >
        {send.isPending ? "..." : "Wyślij"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => { setOpen(false); setMessage(""); }}
      >
        Anuluj
      </Button>
    </div>
  );
}
