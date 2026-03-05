import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMediaDto {
  @IsIn(['image', 'video'])
  public type!: 'image' | 'video';

  @IsUrl()
  public url!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  public width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  public height?: number;

  @IsOptional()
  @Min(0.1)
  public duration?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public caption?: string;

  @IsOptional()
  @IsIn(['public', 'friends', 'private'])
  public visibility?: 'public' | 'friends' | 'private';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  public media!: CreateMediaDto[];
}
