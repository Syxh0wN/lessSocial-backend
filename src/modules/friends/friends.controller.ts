import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  public constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  public request(
    @Req() req: { user: { sub: string } },
    @Body() body: CreateFriendRequestDto,
  ) {
    return this.friendsService.request(req.user.sub, body);
  }

  @Patch('requests/:id')
  @UseGuards(JwtAuthGuard)
  public updateRequest(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: UpdateFriendRequestDto,
  ) {
    return this.friendsService.updateRequest(req.user.sub, id, body);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  public remove(
    @Req() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return this.friendsService.remove(req.user.sub, userId);
  }
}
