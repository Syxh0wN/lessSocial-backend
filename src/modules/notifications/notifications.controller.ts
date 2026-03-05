import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  public constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  public list(@Req() req: { user: { sub: string } }) {
    return this.notificationsService.listForUser(req.user.sub);
  }
}
