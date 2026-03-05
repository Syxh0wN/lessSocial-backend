import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';

@Injectable()
export class FriendsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async request(userId: string, dto: CreateFriendRequestDto) {
    if (userId === dto.toUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const existingFriendship = await this.prismaService.friendship.findFirst({
      where: {
        OR: [
          {
            userAId: userId,
            userBId: dto.toUserId,
          },
          {
            userAId: dto.toUserId,
            userBId: userId,
          },
        ],
      },
    });
    if (existingFriendship) {
      return {
        id: existingFriendship.id,
        fromUserId: userId,
        toUserId: dto.toUserId,
        status: 'accepted' as const,
      };
    }
    const existingRequest = await this.prismaService.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: dto.toUserId,
        },
      },
    });
    if (!existingRequest) {
      return this.prismaService.friendRequest.create({
        data: {
          fromUserId: userId,
          toUserId: dto.toUserId,
          status: 'pending',
        },
      });
    }
    if (existingRequest.status === 'rejected') {
      return this.prismaService.friendRequest.update({
        where: {
          id: existingRequest.id,
        },
        data: {
          status: 'pending',
        },
      });
    }
    return existingRequest;
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
