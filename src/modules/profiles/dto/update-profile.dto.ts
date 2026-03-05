import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
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
  @IsUrl()
  public instagramUrl?: string;

  @IsOptional()
  @IsUrl()
  public facebookUrl?: string;

  @IsOptional()
  @IsUrl()
  public youtubeUrl?: string;

  @IsOptional()
  @IsUrl()
  public xUrl?: string;

  @IsOptional()
  @IsUrl()
  public twitchUrl?: string;

  @IsOptional()
  @IsUrl()
  public kickUrl?: string;
}
