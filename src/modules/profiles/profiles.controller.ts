import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  public constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  public getByUsername(@Param('username') username: string) {
    return this.profilesService.getByUsername(username);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  public updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.profilesService.updateMe(req.user.sub, body);
  }
}
