import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async list(userId: string, cursor?: string, requestedLimit = 10) {
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const friendships = await this.prismaService.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });
    const followedUserIds = friendships.map((friendship) =>
      friendship.userAId === userId ? friendship.userBId : friendship.userAId,
    );

    const posts = await this.prismaService.post.findMany({
      where: {
        OR: [
          {
            userId,
          },
          {
            userId: {
              in: followedUserIds,
            },
            visibility: {
              in: ['public', 'friends'],
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            username: true,
            profile: {
              select: {
                name: true,
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
        media: true,
        likes: true,
        comments: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;
    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}
