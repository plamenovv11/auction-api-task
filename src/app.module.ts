import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionModule } from './auction/auction.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ImportModule } from './import/import.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/barnebys'),
    AuctionModule,
    AnalyticsModule,
    ImportModule,
    HealthModule,
  ],
})
export class AppModule {}
