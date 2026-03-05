import { Controller, Get } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  public constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  public feed() {
    return this.feedService.list();
  }
}
