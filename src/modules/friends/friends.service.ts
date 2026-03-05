import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';

@Injectable()
export class FriendsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async request(userId: string, dto: CreateFriendRequestDto) {
    return this.prismaService.friendRequest.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: dto.toUserId,
        },
      },
      create: {
        fromUserId: userId,
        toUserId: dto.toUserId,
        status: 'pending',
      },
      update: {
        status: 'pending',
      },
    });
  }

  public async updateRequest(
    userId: string,
    requestId: string,
    dto: UpdateFriendRequestDto,
  ) {
    const request = await this.prismaService.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.toUserId !== userId) {
      throw new NotFoundException('Friend request not found');
    }
    const updated = await this.prismaService.friendRequest.update({
      where: { id: requestId },
      data: { status: dto.status },
    });
    if (dto.status === 'accepted') {
      await this.prismaService.friendship.upsert({
        where: {
          userAId_userBId: {
            userAId: request.fromUserId,
            userBId: request.toUserId,
          },
        },
        create: {
          userAId: request.fromUserId,
          userBId: request.toUserId,
        },
        update: {},
      });
    }
    return updated;
  }

  public async remove(userId: string, otherUserId: string) {
    return this.prismaService.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId },
        ],
      },
    });
  }
}
