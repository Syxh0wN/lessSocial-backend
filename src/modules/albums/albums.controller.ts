import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateAlbumItemDto } from './dto/create-album-item.dto';
import { AlbumsService } from './albums.service';

@Controller()
export class AlbumsController {
  public constructor(private readonly albumsService: AlbumsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('albums')
  public create(
    @Req() req: { user: { sub: string } },
    @Body() body: CreateAlbumDto,
  ) {
    return this.albumsService.createAlbum(req.user.sub, body);
  }

  @Post('albums/:id/items')
  @UseGuards(JwtAuthGuard)
  public addItem(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: CreateAlbumItemDto,
  ) {
    return this.albumsService.addItem(req.user.sub, id, body);
  }

  @Get('profiles/:username/albums')
  public listByUsername(@Param('username') username: string) {
    return this.albumsService.listByUsername(username);
  }
}
