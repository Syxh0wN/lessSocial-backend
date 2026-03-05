import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { sanitizeText } from '../../common/sanitizeText';

@Injectable()
export class PostsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async create(userId: string, dto: CreatePostDto) {
    return this.prismaService.post.create({
      data: {
        userId,
        caption: dto.caption ? sanitizeText(dto.caption) : undefined,
        visibility: dto.visibility,
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
  }

  public async findByUsername(username: string) {
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
    return this.prismaService.comment.create({
      data: {
        content: sanitizeText(dto.content),
        userId,
        postId,
      },
    });
  }

  public async reply(commentId: string, userId: string, dto: CreateCommentDto) {
    const parentComment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!parentComment) {
      throw new NotFoundException('Comment not found');
    }
    return this.prismaService.comment.create({
      data: {
        content: sanitizeText(dto.content),
        userId,
        postId: parentComment.postId,
        parentCommentId: commentId,
      },
    });
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

  private async findPost(postId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
