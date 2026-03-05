import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PostsModule } from './modules/posts/posts.module';
import { FriendsModule } from './modules/friends/friends.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { FeedModule } from './modules/feed/feed.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 120,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    ProfilesModule,
    PostsModule,
    FriendsModule,
    TestimonialsModule,
    AlbumsModule,
    FeedModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
