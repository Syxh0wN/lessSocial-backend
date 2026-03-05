import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateAlbumItemDto } from './dto/create-album-item.dto';

@Injectable()
export class AlbumsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async createAlbum(userId: string, dto: CreateAlbumDto) {
    return this.prismaService.album.create({
      data: {
        userId,
        name: dto.name,
      },
    });
  }

  public async addItem(
    userId: string,
    albumId: string,
    dto: CreateAlbumItemDto,
  ) {
    const album = await this.prismaService.album.findUnique({
      where: { id: albumId },
    });
    if (!album || album.userId !== userId) {
      throw new NotFoundException('Album not found');
    }
    return this.prismaService.albumItem.create({
      data: {
        albumId,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        duration: dto.duration,
        caption: dto.caption,
      },
    });
  }

  public async listByUsername(username: string) {
    return this.prismaService.album.findMany({
      where: {
        user: {
          username,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
