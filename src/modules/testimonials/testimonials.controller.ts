import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { TestimonialsService } from './testimonials.service';

@Controller('testimonials')
export class TestimonialsController {
  public constructor(
    private readonly testimonialsService: TestimonialsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  public create(
    @Req() req: { user: { sub: string } },
    @Body() body: CreateTestimonialDto,
  ) {
    return this.testimonialsService.create(req.user.sub, body);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  public accept(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.testimonialsService.accept(req.user.sub, id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  public reject(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.testimonialsService.reject(req.user.sub, id);
  }
}
