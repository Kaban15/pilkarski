"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SendMessageButtonProps {
  recipientUserId: string;
}

export function SendMessageButton({ recipientUserId }: SendMessageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const result = await trpc.message.send.mutate({
        recipientUserId,
        content: message.trim(),
      });
      router.push(`/messages/${result.conversationId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button onClick={handleSend} disabled={sending || !message.trim()} size="sm">
        {sending ? "..." : "Wyślij"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setMessage(""); }}>
        Anuluj
      </Button>
    </div>
  );
}
