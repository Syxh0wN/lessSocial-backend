import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthGoogleDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  public name!: string;

  @IsOptional()
  @IsString()
  public avatarUrl?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/)
  public username!: string;
}
