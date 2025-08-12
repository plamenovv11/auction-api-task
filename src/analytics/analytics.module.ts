import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { ImpressionEvent, ImpressionEventSchema } from './schemas/impression-event.schema';
import { ClickEvent, ClickEventSchema } from './schemas/click-event.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ImpressionEvent.name, schema: ImpressionEventSchema },
      { name: ClickEvent.name, schema: ClickEventSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
