import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(private readonly jwtService: JwtService) {}

  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { sub: string; email: string; username: string };
    }>();
    const authorizationHeader = request.headers.authorization ?? '';
    const token = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice(7)
      : '';
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        username: string;
      }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'devAccessSecret',
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
