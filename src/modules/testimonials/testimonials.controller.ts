import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { TestimonialsService } from './testimonials.service';

@Controller()
export class TestimonialsController {
  public constructor(
    private readonly testimonialsService: TestimonialsService,
  ) {}

  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  public create(
    @Req() req: { user: { sub: string } },
    @Body() body: CreateTestimonialDto,
  ) {
    return this.testimonialsService.create(req.user.sub, body);
  }

  @Get('profiles/:username/testimonials')
  public listAcceptedByUsername(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '10', 10);
    const limit = Number.isNaN(parsedLimit) ? 10 : parsedLimit;
    return this.testimonialsService.listAcceptedByUsername(
      username,
      cursor,
      limit,
    );
  }

  @Patch('testimonials/:id/accept')
  @UseGuards(JwtAuthGuard)
  public accept(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.testimonialsService.accept(req.user.sub, id);
  }

  @Patch('testimonials/:id/reject')
  @UseGuards(JwtAuthGuard)
  public reject(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.testimonialsService.reject(req.user.sub, id);
  }
}
