import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { AuctionItem, AuctionItemSchema } from './schemas/auction-item.schema';
import { AuctionItemRepository } from './repositories/auction-item.repository';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuctionTrackingService } from './services/auction-tracking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuctionItem.name, schema: AuctionItemSchema },
    ]),
    AnalyticsModule,
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionItemRepository, AuctionTrackingService],
  exports: [AuctionService, AuctionItemRepository, AuctionTrackingService],
})
export class AuctionModule {}
