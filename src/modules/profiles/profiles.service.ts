import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async getByUsername(username: string) {
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
    return profile;
  }

  public async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prismaService.profile.update({
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
    });
  }
}
