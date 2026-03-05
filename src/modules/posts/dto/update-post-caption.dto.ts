import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostCaptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  public caption!: string;
}
