import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  public constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  public feed(
    @Req() req: { user: { sub: string } },
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '10', 10);
    const limit = Number.isNaN(parsedLimit) ? 10 : parsedLimit;
    return this.feedService.list(req.user.sub, cursor, limit);
  }
}
