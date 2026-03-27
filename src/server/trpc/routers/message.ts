import { z } from "zod/v4";
import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";
import {
  sendMessageSchema,
  getMessagesSchema,
  markAsReadSchema,
} from "@/lib/validators/message";
import { TRPCError } from "@trpc/server";
import { getUserDisplayName } from "@/lib/labels";

export const messageRouter = router({
  // List conversations for current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const participants = await ctx.db.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    if (participants.length === 0) return [];

    const conversationIds = participants.map((p) => p.conversationId);

    const conversations = await ctx.db.conversation.findMany({
      where: { id: { in: conversationIds } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                club: { select: { id: true, name: true, logoUrl: true } },
                player: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
                coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Sort by last message date (conversations with newest messages first)
    return conversations
      .map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p.userId !== userId
        );
        const lastMessage = conv.messages[0] ?? null;
        return {
          id: conv.id,
          otherUser: otherParticipant?.user ?? null,
          lastMessage,
          createdAt: conv.createdAt,
        };
      })
      .sort((a, b) => {
        const aDate = a.lastMessage?.createdAt ?? a.createdAt;
        const bDate = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }),

  // Get messages in a conversation (cursor-based pagination)
  getMessages: protectedProcedure
    .input(getMessagesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user is participant
      const participant = await ctx.db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId,
          },
        },
      });
      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nie masz dostępu do tej konwersacji" });
      }

      const items = await ctx.db.message.findMany({
        where: { conversationId: input.conversationId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              club: { select: { name: true } },
              player: { select: { firstName: true, lastName: true } },
            },
          },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items: items.reverse(), nextCursor };
    }),

  // Send a message (create conversation if needed)
  send: rateLimitedProcedure({ maxAttempts: 20 })
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.recipientUserId === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz wysłać wiadomości do siebie" });
      }

      // Check recipient exists
      const recipient = await ctx.db.user.findUnique({
        where: { id: input.recipientUserId },
      });
      if (!recipient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono użytkownika" });
      }

      // Find existing conversation between these two users
      const myConversations = await ctx.db.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      const myConvIds = myConversations.map((c) => c.conversationId);

      let conversationId: string | null = null;

      if (myConvIds.length > 0) {
        const shared = await ctx.db.conversationParticipant.findFirst({
          where: {
            conversationId: { in: myConvIds },
            userId: input.recipientUserId,
          },
        });
        if (shared) conversationId = shared.conversationId;
      }

      // Create conversation if not exists
      if (!conversationId) {
        const conv = await ctx.db.conversation.create({
          data: {
            participants: {
              create: [
                { userId },
                { userId: input.recipientUserId },
              ],
            },
          },
        });
        conversationId = conv.id;
      }

      // Create message
      const message = await ctx.db.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: input.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              role: true,
              club: { select: { name: true } },
              player: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      // Notify recipient (fire-and-forget)
      const senderName = getUserDisplayName(message.sender);
      ctx.db.notification.create({
        data: {
          userId: input.recipientUserId,
          type: "NEW_MESSAGE",
          title: "Nowa wiadomość",
          message: `${senderName}: ${input.content.substring(0, 100)}`,
          link: `/messages/${conversationId}`,
        },
      }).catch(() => {});

      return { message, conversationId };
    }),

  // Mark all messages in conversation as read
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user is participant
      const participant = await ctx.db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId,
          },
        },
      });
      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Mark unread messages from OTHER users as read
      await ctx.db.message.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return { success: true };
    }),

  // Get unread count for badge
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const myConversations = await ctx.db.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    if (myConversations.length === 0) return 0;

    const count = await ctx.db.message.count({
      where: {
        conversationId: { in: myConversations.map((c) => c.conversationId) },
        senderId: { not: userId },
        readAt: null,
      },
    });

    return count;
  }),

  // Find or get conversation ID with a specific user (for "Napisz wiadomość" button)
  getConversationWith: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const myUserId = ctx.session.user.id;

      const myConversations = await ctx.db.conversationParticipant.findMany({
        where: { userId: myUserId },
        select: { conversationId: true },
      });

      if (myConversations.length === 0) return null;

      const shared = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId: { in: myConversations.map((c) => c.conversationId) },
          userId: input.userId,
        },
      });

      return shared?.conversationId ?? null;
    }),

  // Get club group chat for current user
  getClubChat: protectedProcedure.query(async ({ ctx }) => {
    // Find user's club: either they OWN a club or are ACCEPTED member
    const ownedClub = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true, name: true, logoUrl: true },
    });

    let clubId = ownedClub?.id ?? null;
    let clubName = ownedClub?.name ?? null;
    let clubLogo = ownedClub?.logoUrl ?? null;

    if (!clubId) {
      const membership = await ctx.db.clubMembership.findFirst({
        where: { memberUserId: ctx.session.user.id, status: "ACCEPTED" },
        include: { club: { select: { id: true, name: true, logoUrl: true } } },
      });
      if (membership) {
        clubId = membership.club.id;
        clubName = membership.club.name;
        clubLogo = membership.club.logoUrl;
      }
    }

    if (!clubId) return null;

    // Find or create club group conversation
    let conversation = await ctx.db.conversation.findUnique({
      where: { clubId },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await ctx.db.conversation.create({
        data: { clubId, participants: { create: { userId: ctx.session.user.id } } },
      });
    }

    // Ensure current user is participant
    await ctx.db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: ctx.session.user.id } },
      update: {},
      create: { conversationId: conversation.id, userId: ctx.session.user.id },
    });

    // Get recent messages
    const messages = await ctx.db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: {
            id: true, email: true, role: true,
            club: { select: { name: true } },
            player: { select: { firstName: true, lastName: true, photoUrl: true } },
            coach: { select: { firstName: true, lastName: true, photoUrl: true } },
          },
        },
      },
    });

    const memberCount = await ctx.db.clubMembership.count({
      where: { clubId, status: "ACCEPTED" },
    });

    return {
      conversationId: conversation.id,
      club: { id: clubId, name: clubName, logoUrl: clubLogo },
      messages: messages.reverse(),
      memberCount: memberCount + 1,
    };
  }),

  // Send message to club group chat
  sendToClubChat: rateLimitedProcedure({ maxAttempts: 30 })
    .input(z.object({ conversationId: z.string().uuid(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        select: { clubId: true },
      });
      if (!conversation?.clubId) throw new TRPCError({ code: "FORBIDDEN" });

      // Verify user is club owner or accepted member
      const club = await ctx.db.club.findUnique({
        where: { id: conversation.clubId },
        select: { userId: true },
      });
      const isOwner = club?.userId === ctx.session.user.id;
      if (!isOwner) {
        const membership = await ctx.db.clubMembership.findFirst({
          where: { clubId: conversation.clubId, memberUserId: ctx.session.user.id, status: "ACCEPTED" },
        });
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.message.create({
        data: { conversationId: input.conversationId, senderId: ctx.session.user.id, content: input.content },
        include: {
          sender: {
            select: {
              id: true, email: true, role: true,
              club: { select: { name: true } },
              player: { select: { firstName: true, lastName: true, photoUrl: true } },
              coach: { select: { firstName: true, lastName: true, photoUrl: true } },
            },
          },
        },
      });
    }),
});
