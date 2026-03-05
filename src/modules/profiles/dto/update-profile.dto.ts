import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
