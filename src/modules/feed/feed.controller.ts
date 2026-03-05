import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  public constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  public feed(@Req() req: { user: { sub: string } }) {
    return this.feedService.list(req.user.sub);
  }
}
