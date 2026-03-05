import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async list(userId: string) {
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

    return this.prismaService.post.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
