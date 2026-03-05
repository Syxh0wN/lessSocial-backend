import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async searchProfiles(query: string) {
    const safeQuery = query.trim();
    if (!safeQuery) {
      return [];
    }
    const profiles = await this.prismaService.profile.findMany({
      where: {
        OR: [
          {
            name: {
              contains: safeQuery,
            },
          },
          {
            user: {
              username: {
                contains: safeQuery,
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 8,
    });
    return profiles.map((profileItem) => ({
      username: profileItem.user.username,
      name: profileItem.name ?? profileItem.user.username,
      avatarUrl: profileItem.avatarUrl ?? null,
      bio: profileItem.bio ?? null,
    }));
  }

  public async listSuggestions(userId: string, requestedLimit = 8) {
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const [friendships, outgoingRequests] = await Promise.all([
      this.prismaService.friendship.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: {
          userAId: true,
          userBId: true,
        },
      }),
      this.prismaService.friendRequest.findMany({
        where: {
          fromUserId: userId,
          status: 'pending',
        },
        select: {
          toUserId: true,
        },
      }),
    ]);

    const excludedUserIds = new Set<string>([userId]);
    for (const friendship of friendships) {
      excludedUserIds.add(
        friendship.userAId === userId ? friendship.userBId : friendship.userAId,
      );
    }
    for (const requestItem of outgoingRequests) {
      excludedUserIds.add(requestItem.toUserId);
    }

    const profiles = await this.prismaService.profile.findMany({
      where: {
        userId: {
          notIn: [...excludedUserIds],
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return profiles.map((profileItem) => ({
      userId: profileItem.userId,
      username: profileItem.user.username,
      name: profileItem.name ?? profileItem.user.username,
      avatarUrl: profileItem.avatarUrl ?? null,
      bio: profileItem.bio ?? null,
    }));
  }

  public async listDiscoverProfiles(
    requestedLimit = 8,
    viewerUserId?: string,
    excludeUsername?: string,
  ) {
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const whereClause: Prisma.ProfileWhereInput = {};
    if (viewerUserId) {
      whereClause.userId = {
        not: viewerUserId,
      };
    }
    if (excludeUsername) {
      whereClause.user = {
        username: {
          not: excludeUsername,
        },
      };
    }
    const profiles = await this.prismaService.profile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
    return profiles.map((profileItem) => ({
      userId: profileItem.userId,
      username: profileItem.user.username,
      name: profileItem.name ?? profileItem.user.username,
      avatarUrl: profileItem.avatarUrl ?? null,
      bio: profileItem.bio ?? null,
    }));
  }

  public async getByUsername(username: string, viewerUserId?: string) {
    const profile = await this.prismaService.profile.findFirst({
      where: { user: { username } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    if (viewerUserId && viewerUserId !== profile.userId) {
      await this.prismaService.profileVisit.upsert({
        where: {
          visitorId_visitedUserId: {
            visitorId: viewerUserId,
            visitedUserId: profile.userId,
          },
        },
        create: {
          visitorId: viewerUserId,
          visitedUserId: profile.userId,
          visitedAt: new Date(),
        },
        update: {
          visitedAt: new Date(),
        },
      });
    }
    if (viewerUserId !== profile.userId) {
      const [followers, following] = await Promise.all([
        this.prismaService.friendship.findMany({
          where: {
            userBId: profile.userId,
          },
          include: {
            userA: {
              select: {
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: 'desc',
          },
          take: 20,
        }),
        this.prismaService.friendship.findMany({
          where: {
            userAId: profile.userId,
          },
          include: {
            userB: {
              select: {
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: 'desc',
          },
          take: 20,
        }),
      ]);
      return {
        ...profile,
        followersCount: followers.length,
        followingCount: following.length,
        followers: followers.map((friendshipItem) => ({
          username: friendshipItem.userA.username,
          name:
            friendshipItem.userA.profile?.name ?? friendshipItem.userA.username,
          avatarUrl: friendshipItem.userA.profile?.avatarUrl ?? null,
        })),
        following: following.map((friendshipItem) => ({
          username: friendshipItem.userB.username,
          name:
            friendshipItem.userB.profile?.name ?? friendshipItem.userB.username,
          avatarUrl: friendshipItem.userB.profile?.avatarUrl ?? null,
        })),
      };
    }
    const [followers, following] = await Promise.all([
      this.prismaService.friendship.findMany({
        where: {
          userBId: profile.userId,
        },
        include: {
          userA: {
            select: {
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: 20,
      }),
      this.prismaService.friendship.findMany({
        where: {
          userAId: profile.userId,
        },
        include: {
          userB: {
            select: {
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: 20,
      }),
    ]);
    const recentVisitors = await this.prismaService.profileVisit.findMany({
      where: {
        visitedUserId: profile.userId,
      },
      include: {
        visitor: {
          select: {
            username: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        visitedAt: 'desc',
      },
      take: 20,
    });
    return {
      ...profile,
      followersCount: followers.length,
      followingCount: following.length,
      followers: followers.map((friendshipItem) => ({
        username: friendshipItem.userA.username,
        name:
          friendshipItem.userA.profile?.name ?? friendshipItem.userA.username,
        avatarUrl: friendshipItem.userA.profile?.avatarUrl ?? null,
      })),
      following: following.map((friendshipItem) => ({
        username: friendshipItem.userB.username,
        name:
          friendshipItem.userB.profile?.name ?? friendshipItem.userB.username,
        avatarUrl: friendshipItem.userB.profile?.avatarUrl ?? null,
      })),
      recentVisitors: recentVisitors.map((visitItem) => ({
        username: visitItem.visitor.username,
        avatarUrl: visitItem.visitor.profile?.avatarUrl ?? null,
        visitedAt: visitItem.visitedAt,
      })),
    };
  }

  public async updateVisibility(userId: string, isPrivate: boolean) {
    return this.prismaService.profile.update({
      where: {
        userId,
      },
      data: {
        isPrivate,
      },
    });
  }

  public async updateMe(userId: string, dto: UpdateProfileDto) {
    const normalizedUsername = dto.username?.trim().toLowerCase();
    try {
      const updatedProfile = await this.prismaService.$transaction(
        async (tx) => {
          if (normalizedUsername) {
            await tx.user.update({
              where: {
                id: userId,
              },
              data: {
                username: normalizedUsername,
              },
            });
          }
          return tx.profile.update({
            where: {
              userId,
            },
            data: {
              name: dto.name,
              bio: dto.bio,
              avatarUrl: dto.avatarUrl,
              instagramUrl: dto.instagramUrl,
              facebookUrl: dto.facebookUrl,
              youtubeUrl: dto.youtubeUrl,
              xUrl: dto.xUrl,
              twitchUrl: dto.twitchUrl,
              kickUrl: dto.kickUrl,
            },
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          });
        },
      );
      await this.createMentionNotificationsFromBio(userId, dto.bio);
      return updatedProfile;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username already in use');
      }
      throw new InternalServerErrorException('Could not update profile');
    }
  }

  private extractMentionUsernames(text?: string) {
    if (!text) {
      return [];
    }
    const matchItems = text.match(/@([a-z0-9_]+)/gi) ?? [];
    return [...new Set(matchItems.map((item) => item.slice(1).toLowerCase()))];
  }

  private async createMentionNotificationsFromBio(
    actorUserId: string,
    bio?: string,
  ) {
    const mentionedUsernames = this.extractMentionUsernames(bio);
    if (mentionedUsernames.length === 0) {
      return;
    }
    const mentionedUsers = await this.prismaService.user.findMany({
      where: {
        username: {
          in: mentionedUsernames,
        },
      },
      select: {
        id: true,
      },
    });
    const notificationsData = mentionedUsers
      .filter((userItem) => userItem.id !== actorUserId)
      .map((userItem) => ({
        mentionedUserId: userItem.id,
        actorUserId,
        sourceType: 'profileBio' as const,
      }));
    if (notificationsData.length === 0) {
      return;
    }
    await this.prismaService.mentionNotification.createMany({
      data: notificationsData,
    });
  }
}
