import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { sanitizeText } from '../../common/sanitizeText';

@Injectable()
export class TestimonialsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async create(userId: string, dto: CreateTestimonialDto) {
    return this.prismaService.testimonial.create({
      data: {
        fromUserId: userId,
        toUserId: dto.toUserId,
        content: sanitizeText(dto.content),
        status: 'pending',
      },
    });
  }

  public async accept(userId: string, testimonialId: string) {
    return this.updateStatus(userId, testimonialId, 'accepted');
  }

  public async reject(userId: string, testimonialId: string) {
    return this.updateStatus(userId, testimonialId, 'rejected');
  }

  public async listAcceptedByUsername(
    username: string,
    cursor?: string,
    requestedLimit = 10,
  ) {
    const limit = Math.min(Math.max(requestedLimit, 1), 20);
    const [itemsRaw, totalCount] = await Promise.all([
      this.prismaService.testimonial.findMany({
        where: {
          status: 'accepted',
          toUser: {
            username,
          },
        },
        include: {
          fromUser: {
            select: {
              username: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
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
      this.prismaService.testimonial.count({
        where: {
          status: 'accepted',
          toUser: {
            username,
          },
        },
      }),
    ]);
    const hasMore = itemsRaw.length > limit;
    const items = hasMore ? itemsRaw.slice(0, limit) : itemsRaw;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;
    return {
      items,
      hasMore,
      nextCursor,
      totalCount,
    };
  }

  public async listAcceptedSimpleByUsername(username: string) {
    return this.prismaService.testimonial.findMany({
      where: {
        status: 'accepted',
        toUser: {
          username,
        },
      },
      include: {
        fromUser: {
          select: {
            username: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async updateStatus(
    userId: string,
    testimonialId: string,
    status: 'accepted' | 'rejected',
  ) {
    const testimonial = await this.prismaService.testimonial.findUnique({
      where: { id: testimonialId },
    });
    if (!testimonial || testimonial.toUserId !== userId) {
      throw new NotFoundException('Testimonial not found');
    }
    return this.prismaService.testimonial.update({
      where: { id: testimonialId },
      data: { status },
    });
  }
}
