import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  public check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
