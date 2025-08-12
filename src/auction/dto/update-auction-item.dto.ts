import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { AuctionCategory, AuctionStatus } from '../../common/constants/auction.constants';

export class UpdateAuctionItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AuctionCategory)
  category?: AuctionCategory;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(AuctionStatus)
  status?: AuctionStatus;
}
