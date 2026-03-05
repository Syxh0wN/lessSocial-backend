import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostCaptionDto } from './dto/update-post-caption.dto';
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
  public getPostsByUsername(
    @Param('username') username: string,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    return this.postsService.findByUsername(username, viewerUserId);
  }

  @Get('posts/:id')
  public getPostById(
    @Param('id') id: string,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    return this.postsService.findById(id, viewerUserId);
  }

  @Get('hashtags/:tag/posts')
  public getPostsByHashtag(
    @Param('tag') tag: string,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const viewerUserId = this.extractViewerUserId(req.headers.authorization);
    return this.postsService.findByHashtag(tag, viewerUserId);
  }

  @Get('posts/:id/likes')
  public getPostLikes(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '20', 10);
    const limit = Number.isNaN(parsedLimit) ? 20 : parsedLimit;
    return this.postsService.listLikes(id, cursor, limit);
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

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  public updatePostCaption(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: UpdatePostCaptionDto,
  ) {
    return this.postsService.updatePostCaption(id, req.user.sub, body);
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

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  public updateComment(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: UpdateCommentDto,
  ) {
    return this.postsService.updateComment(id, req.user.sub, body);
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
