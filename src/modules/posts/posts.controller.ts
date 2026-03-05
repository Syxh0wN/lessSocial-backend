import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller()
export class PostsController {
  public constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  public createPost(
    @Req() req: { user: { sub: string } },
    @Body() body: CreatePostDto,
  ) {
    return this.postsService.create(req.user.sub, body);
  }

  @Get('profiles/:username/posts')
  public getPostsByUsername(@Param('username') username: string) {
    return this.postsService.findByUsername(username);
  }

  @Get('posts/:id')
  public getPostById(
    @Param('id') id: string,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    return this.postsService.findById(id, viewerUserId);
  }

  @Post('posts/:id/likes')
  @UseGuards(JwtAuthGuard)
  public likePost(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.postsService.like(id, req.user.sub);
  }

  @Delete('posts/:id/likes')
  @UseGuards(JwtAuthGuard)
  public unlikePost(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.postsService.unlike(id, req.user.sub);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  public addComment(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, req.user.sub, body);
  }

  @Post('comments/:id/replies')
  @UseGuards(JwtAuthGuard)
  public replyComment(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.postsService.reply(id, req.user.sub, body);
  }

  @Post('comments/:id/likes')
  @UseGuards(JwtAuthGuard)
  public likeComment(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.postsService.likeComment(id, req.user.sub);
  }

  private extractViewerUserId(authorizationHeader?: string) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const token = authorizationHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub: string;
      }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'devAccessSecret',
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
