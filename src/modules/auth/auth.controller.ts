import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGoogleDto } from './dto/auth-google.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('google')
  public loginGoogle(@Body() body: AuthGoogleDto) {
    return this.authService.loginWithGoogle(body);
  }

  @Post('refresh')
  public refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  public logout() {
    return this.authService.logout();
  }
}
