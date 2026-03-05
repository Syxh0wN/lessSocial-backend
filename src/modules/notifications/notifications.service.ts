import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type NotificationItem = {
  id: string;
  type: 'postLike' | 'postComment' | 'friendRequest' | 'testimonial';
  createdAt: string;
  actorUsername: string;
  message: string;
  targetId?: string;
};

@Injectable()
export class NotificationsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async listForUser(userId: string) {
    const [likes, comments, requests, testimonials] = await Promise.all([
      this.prismaService.postLike.findMany({
        where: {
          post: {
            userId,
          },
          userId: {
            not: userId,
          },
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          post: {
            select: {
              id: true,
            },
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.comment.findMany({
        where: {
          post: {
            userId,
          },
          userId: {
            not: userId,
          },
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          post: {
            select: {
              id: true,
            },
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.friendRequest.findMany({
        where: {
          toUserId: userId,
          status: 'pending',
        },
        include: {
          fromUser: {
            select: {
              username: true,
            },
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.testimonial.findMany({
        where: {
          toUserId: userId,
          status: 'pending',
        },
        include: {
          fromUser: {
            select: {
              username: true,
            },
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const notifications: NotificationItem[] = [
      ...likes.map((likeItem) => ({
        id: `like_${likeItem.id}`,
        type: 'postLike' as const,
        createdAt: likeItem.createdAt.toISOString(),
        actorUsername: likeItem.user.username,
        message: 'curtiu sua postagem',
        targetId: likeItem.post.id,
      })),
      ...comments.map((commentItem) => ({
        id: `comment_${commentItem.id}`,
        type: 'postComment' as const,
        createdAt: commentItem.createdAt.toISOString(),
        actorUsername: commentItem.user.username,
        message: 'comentou na sua postagem',
        targetId: commentItem.post.id,
      })),
      ...requests.map((requestItem) => ({
        id: `friend_${requestItem.id}`,
        type: 'friendRequest' as const,
        createdAt: requestItem.createdAt.toISOString(),
        actorUsername: requestItem.fromUser.username,
        message: 'enviou solicitacao de amizade',
      })),
      ...testimonials.map((testimonialItem) => ({
        id: `testimonial_${testimonialItem.id}`,
        type: 'testimonial' as const,
        createdAt: testimonialItem.createdAt.toISOString(),
        actorUsername: testimonialItem.fromUser.username,
        message: 'enviou um depoimento para voce',
      })),
    ]
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem.createdAt).getTime() -
          new Date(firstItem.createdAt).getTime(),
      )
      .slice(0, 30);

    return {
      items: notifications,
      unreadCount: notifications.length,
    };
  }
}
