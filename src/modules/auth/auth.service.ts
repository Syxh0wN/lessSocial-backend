import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGoogleDto } from './dto/auth-google.dto';

@Injectable()
export class AuthService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async loginWithGoogle(payload: AuthGoogleDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
      },
    });
    const user = await this.prismaService.user.upsert({
      where: { email: payload.email },
      create: {
        email: payload.email,
        username: payload.username,
        provider: 'google',
        profile: {
          create: {
            name: payload.name,
            avatarUrl: payload.avatarUrl,
          },
        },
      },
      update: {
        profile: {
          update: {
            name: payload.name,
            avatarUrl: payload.avatarUrl,
          },
        },
      },
    });
    const tokens = await this.buildTokens(user.id, user.email, user.username);
    return {
      ...tokens,
      isNewUser: !existingUser,
    };
  }

  public async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        username: string;
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'devRefreshSecret',
      });
      return this.buildTokens(payload.sub, payload.email, payload.username);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public logout() {
    return { success: true };
  }

  private async buildTokens(userId: string, email: string, username: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, username },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'devAccessSecret',
        expiresIn: '15m',
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, username },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'devRefreshSecret',
        expiresIn: '7d',
      },
    );
    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, username },
    };
  }
}
