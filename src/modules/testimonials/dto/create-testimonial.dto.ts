import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsUUID()
  public toUserId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(600)
  public content!: string;
}
