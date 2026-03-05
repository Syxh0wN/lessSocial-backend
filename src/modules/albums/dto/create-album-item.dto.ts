import { IsIn, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateAlbumItemDto {
  @IsUrl()
  public mediaUrl!: string;

  @IsIn(['image', 'video'])
  public mediaType!: 'image' | 'video';

  @IsOptional()
  @Min(0.1)
  public duration?: number;

  @IsOptional()
  @IsString()
  public caption?: string;
}
