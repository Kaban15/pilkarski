import type { PrismaClient } from "@/generated/prisma/client";
import { Resend } from "resend";
import { renderEmailHtml } from "@/lib/email-template";
import { env } from "@/env";

const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

const FROM = process.env.NODE_ENV === "production"
  ? "PilkaSport <noreply@pilkasport.pl>"
  : "PilkaSport <onboarding@resend.dev>";

interface EmailBody {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

export async function sendEmailToUser(
  db: Pick<PrismaClient, "user">,
  userId: string,
  subject: string,
  body: EmailBody,
): Promise<void> {
  if (!resend) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) return;

  const html = renderEmailHtml(body.title, body.message, body.ctaLabel, body.ctaUrl);

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject,
    html,
  });
}
