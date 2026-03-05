import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async list() {
    return this.prismaService.post.findMany({
      where: {
        visibility: 'public',
      },
      include: {
        user: {
          select: {
            username: true,
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
