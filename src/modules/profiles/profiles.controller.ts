import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileVisibilityDto } from './dto/update-profile-visibility.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  public constructor(
    private readonly profilesService: ProfilesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('search')
  public searchProfiles(@Query('query') query?: string) {
    return this.profilesService.searchProfiles(query ?? '');
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  public suggestions(
    @Req() req: { user: { sub: string } },
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '8', 10);
    const limit = Number.isNaN(parsedLimit) ? 8 : parsedLimit;
    return this.profilesService.listSuggestions(req.user.sub, limit);
  }

  @Get('discover')
  public discover(
    @Req() req: { headers: { authorization?: string } },
    @Query('limit') limitRaw?: string,
    @Query('excludeUsername') excludeUsernameRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '8', 10);
    const limit = Number.isNaN(parsedLimit) ? 8 : parsedLimit;
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    const excludeUsername = excludeUsernameRaw?.trim().toLowerCase();
    return this.profilesService.listDiscoverProfiles(
      limit,
      viewerUserId,
      excludeUsername,
    );
  }

  @Get(':username')
  public getByUsername(
    @Param('username') username: string,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    return this.profilesService.getByUsername(username, viewerUserId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  public updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.profilesService.updateMe(req.user.sub, body);
  }

  @Patch('me/visibility')
  @UseGuards(JwtAuthGuard)
  public updateVisibility(
    @Req() req: { user: { sub: string } },
    @Body() body: UpdateProfileVisibilityDto,
  ) {
    return this.profilesService.updateVisibility(req.user.sub, body.isPrivate);
  }

  private extractViewerUserId(authorizationHeader?: string) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const token = authorizationHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub: string;
      }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'devAccessSecret',
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
