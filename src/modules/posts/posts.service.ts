import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { UpdatePostCaptionDto } from './dto/update-post-caption.dto';
import { sanitizeText } from '../../common/sanitizeText';

@Injectable()
export class PostsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async create(userId: string, dto: CreatePostDto) {
    const createdPost = await this.prismaService.post.create({
      data: {
        userId,
        caption: dto.caption ? sanitizeText(dto.caption) : undefined,
        visibility: dto.visibility ?? 'public',
        media: {
          createMany: {
            data: dto.media.map((mediaItem) => ({
              type: mediaItem.type,
              url: mediaItem.url,
              width: mediaItem.width,
              height: mediaItem.height,
              duration: mediaItem.duration,
            })),
          },
        },
      },
      include: {
        media: true,
      },
    });
    await this.createMentionNotifications({
      actorUserId: userId,
      text: createdPost.caption ?? undefined,
      sourceType: 'postCaption',
      postId: createdPost.id,
    });
    return createdPost;
  }

  public async findByUsername(username: string, viewerUserId?: string) {
    const profile = await this.prismaService.profile.findFirst({
      where: {
        user: {
          username,
        },
      },
      select: {
        userId: true,
        isPrivate: true,
      },
    });
    if (!profile) {
      return [];
    }
    const isOwner = viewerUserId === profile.userId;
    if (profile.isPrivate && !isOwner) {
      if (!viewerUserId) {
        return [];
      }
      const isFriend = await this.areUsersFriends(viewerUserId, profile.userId);
      if (!isFriend) {
        return [];
      }
    }
    return this.prismaService.post.findMany({
      where: {
        user: {
          username,
        },
      },
      include: {
        media: true,
        likes: true,
        comments: {
          where: {
            parentCommentId: null,
          },
          include: {
            replies: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public async findById(postId: string, viewerUserId?: string) {
    const [likesCount, viewerLike] = await Promise.all([
      this.prismaService.postLike.count({
        where: {
          postId,
        },
      }),
      viewerUserId
        ? this.prismaService.postLike.findUnique({
            where: {
              userId_postId: {
                userId: viewerUserId,
                postId,
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
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
        likes: {
          take: 5,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: {
            user: {
              select: {
                username: true,
                profile: {
                  select: {
                    name: true,
                    avatarUrl: true,
                    bio: true,
                  },
                },
              },
            },
          },
        },
        comments: {
          where: {
            parentCommentId: null,
          },
          include: {
            user: {
              select: {
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
            likes: true,
            replies: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
                likes: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const isOwner = viewerUserId === post.userId;
    if (!isOwner) {
      if (post.visibility === 'private') {
        throw new NotFoundException('Post not found');
      }
      if (post.visibility === 'friends') {
        if (!viewerUserId) {
          throw new NotFoundException('Post not found');
        }
        const canSeeByFriendship = await this.areUsersFriends(
          viewerUserId,
          post.userId,
        );
        if (!canSeeByFriendship) {
          throw new NotFoundException('Post not found');
        }
      }
      const ownerProfile = await this.prismaService.profile.findUnique({
        where: {
          userId: post.userId,
        },
        select: {
          isPrivate: true,
        },
      });
      if (ownerProfile?.isPrivate) {
        if (!viewerUserId) {
          throw new NotFoundException('Post not found');
        }
        const canSeePrivateProfile = await this.areUsersFriends(
          viewerUserId,
          post.userId,
        );
        if (!canSeePrivateProfile) {
          throw new NotFoundException('Post not found');
        }
      }
    }
    return {
      ...post,
      likesCount,
      viewerHasLiked: Boolean(viewerLike),
    };
  }

  public async listLikes(postId: string, cursor?: string, requestedLimit = 20) {
    await this.findPost(postId);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const [likesPage, totalCount] = await Promise.all([
      this.prismaService.postLike.findMany({
        where: {
          postId,
        },
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      }),
      this.prismaService.postLike.count({
        where: {
          postId,
        },
      }),
    ]);
    const hasMore = likesPage.length > limit;
    const items = hasMore ? likesPage.slice(0, limit) : likesPage;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;
    return {
      items: items.map((likeItem) => ({
        id: likeItem.id,
        user: {
          username: likeItem.user.username,
          profile: {
            name: likeItem.user.profile?.name,
            avatarUrl: likeItem.user.profile?.avatarUrl,
            bio: likeItem.user.profile?.bio,
          },
        },
      })),
      totalCount,
      hasMore,
      nextCursor,
    };
  }

  public async findByHashtag(tag: string, viewerUserId?: string) {
    const normalizedTag = tag.trim().toLowerCase();
    if (!/^[a-z0-9_]{1,50}$/i.test(normalizedTag)) {
      throw new BadRequestException('Invalid hashtag');
    }
    const hashtagToken = `#${normalizedTag}`;
    const friendships = viewerUserId
      ? await this.prismaService.friendship.findMany({
          where: {
            OR: [{ userAId: viewerUserId }, { userBId: viewerUserId }],
          },
          select: {
            userAId: true,
            userBId: true,
          },
        })
      : [];
    const friendIds = viewerUserId
      ? friendships.map((friendship) =>
          friendship.userAId === viewerUserId
            ? friendship.userBId
            : friendship.userAId,
        )
      : [];
    return this.prismaService.post.findMany({
      where: {
        AND: [
          {
            caption: {
              contains: hashtagToken,
            },
          },
          viewerUserId
            ? {
                OR: [
                  {
                    userId: viewerUserId,
                  },
                  {
                    AND: [
                      {
                        visibility: 'public',
                      },
                      {
                        user: {
                          profile: {
                            is: {
                              isPrivate: false,
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    AND: [
                      {
                        userId: {
                          in: friendIds,
                        },
                      },
                      {
                        OR: [
                          {
                            visibility: 'public',
                          },
                          {
                            visibility: 'friends',
                          },
                        ],
                      },
                    ],
                  },
                ],
              }
            : {
                AND: [
                  {
                    visibility: 'public',
                  },
                  {
                    user: {
                      profile: {
                        is: {
                          isPrivate: false,
                        },
                      },
                    },
                  },
                ],
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
                instagramUrl: true,
                facebookUrl: true,
                youtubeUrl: true,
                xUrl: true,
                twitchUrl: true,
                kickUrl: true,
              },
            },
          },
        },
        media: true,
        likes: true,
        comments: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  public async like(postId: string, userId: string) {
    await this.findPost(postId);
    return this.prismaService.postLike.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
      },
      update: {},
    });
  }

  public async unlike(postId: string, userId: string) {
    await this.findPost(postId);
    return this.prismaService.postLike.deleteMany({
      where: {
        userId,
        postId,
      },
    });
  }

  public async addComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    await this.findPost(postId);
    const createdComment = await this.prismaService.comment.create({
      data: {
        content: sanitizeText(dto.content),
        userId,
        postId,
      },
    });
    await this.createMentionNotifications({
      actorUserId: userId,
      text: createdComment.content,
      sourceType: 'commentContent',
      postId,
      commentId: createdComment.id,
    });
    return createdComment;
  }

  public async reply(commentId: string, userId: string, dto: CreateCommentDto) {
    const parentComment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!parentComment) {
      throw new NotFoundException('Comment not found');
    }
    const createdReply = await this.prismaService.comment.create({
      data: {
        content: sanitizeText(dto.content),
        userId,
        postId: parentComment.postId,
        parentCommentId: commentId,
      },
    });
    await this.createMentionNotifications({
      actorUserId: userId,
      text: createdReply.content,
      sourceType: 'commentContent',
      postId: parentComment.postId,
      commentId: createdReply.id,
    });
    return createdReply;
  }

  public async likeComment(commentId: string, userId: string) {
    return this.prismaService.commentLike.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
      create: {
        userId,
        commentId,
      },
      update: {},
    });
  }

  public async updatePostCaption(
    postId: string,
    userId: string,
    dto: UpdatePostCaptionDto,
  ) {
    const post = await this.findPost(postId);
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own post');
    }
    const updatedPost = await this.prismaService.post.update({
      where: { id: postId },
      data: {
        caption: sanitizeText(dto.caption),
      },
    });
    await this.createMentionNotifications({
      actorUserId: userId,
      text: updatedPost.caption ?? undefined,
      sourceType: 'postCaption',
      postId: updatedPost.id,
    });
    return updatedPost;
  }

  public async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comment');
    }
    const updatedComment = await this.prismaService.comment.update({
      where: { id: commentId },
      data: {
        content: sanitizeText(dto.content),
      },
    });
    await this.createMentionNotifications({
      actorUserId: userId,
      text: updatedComment.content,
      sourceType: 'commentContent',
      postId: updatedComment.postId,
      commentId: updatedComment.id,
    });
    return updatedComment;
  }

  private async findPost(postId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async areUsersFriends(userAId: string, userBId: string) {
    if (userAId === userBId) {
      return true;
    }
    const friendship = await this.prismaService.friendship.findFirst({
      where: {
        OR: [
          {
            userAId,
            userBId,
          },
          {
            userAId: userBId,
            userBId: userAId,
          },
        ],
      },
      select: {
        id: true,
      },
    });
    return Boolean(friendship);
  }

  private extractMentionUsernames(text?: string) {
    if (!text) {
      return [];
    }
    const matchItems = text.match(/@([a-z0-9_]+)/gi) ?? [];
    return [...new Set(matchItems.map((item) => item.slice(1).toLowerCase()))];
  }

  private async createMentionNotifications(params: {
    actorUserId: string;
    text?: string;
    sourceType: 'postCaption' | 'commentContent' | 'profileBio';
    postId?: string;
    commentId?: string;
  }) {
    const mentionedUsernames = this.extractMentionUsernames(params.text);
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
      .filter((userItem) => userItem.id !== params.actorUserId)
      .map((userItem) => ({
        mentionedUserId: userItem.id,
        actorUserId: params.actorUserId,
        sourceType: params.sourceType,
        postId: params.postId,
        commentId: params.commentId,
      }));
    if (notificationsData.length === 0) {
      return;
    }
    await this.prismaService.mentionNotification.createMany({
      data: notificationsData,
    });
  }
}
