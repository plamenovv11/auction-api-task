import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AuctionCategory, AuctionStatus } from '../../common/constants/auction.constants';

export class CreateAuctionItemDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(AuctionCategory)
  category: AuctionCategory;

  @IsNumber()
  price: number;

  @IsEnum(AuctionStatus)
  status: AuctionStatus;

  @IsOptional()
  @IsDateString()
  created_at?: string;
}
