import { IsIn } from 'class-validator';

export class UpdateFriendRequestDto {
  @IsIn(['accepted', 'rejected'])
  public status!: 'accepted' | 'rejected';
}
