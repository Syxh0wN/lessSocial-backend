import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/)
  public username?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  public name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  public bio?: string;

  @IsOptional()
  @IsString()
  public avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public instagramUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public facebookUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public youtubeUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public xUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public twitchUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^@[a-z0-9._-]{1,30}$/i)
  public kickUrl?: string;
}
