import { IsBoolean } from 'class-validator';

export class UpdateProfileVisibilityDto {
  @IsBoolean()
  public isPrivate!: boolean;
}
