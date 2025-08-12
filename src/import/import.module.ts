import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { AuctionModule } from '../auction/auction.module';

@Module({
  imports: [AuctionModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
