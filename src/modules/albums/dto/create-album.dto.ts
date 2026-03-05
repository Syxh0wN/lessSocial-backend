import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  public name!: string;
}
