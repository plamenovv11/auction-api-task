import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackImpressionDto } from './dto/track-impression.dto';
import { TrackClickDto } from './dto/track-click.dto';

const DEFAULT_TRENDING_ITEMS_LIMIT = 5;

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  // Batch processing endpoints for high-volume scenarios
  @Post('batch/impressions')
  @HttpCode(HttpStatus.OK)
  async trackImpressionsBatch(
    @Body() impressions: TrackImpressionDto[]
  ) {
    const results = await this.analyticsService.trackImpressionsBatch(impressions);

    return {
      success: true,
      data: results,
      message: `${results.length} impressions tracked successfully`,
      total: results.length,
    };
  }

  @Post('batch/clicks')
  @HttpCode(HttpStatus.OK)
  async trackClicksBatch(
    @Body() clicks: TrackClickDto[]
  ) {
    const results = await this.analyticsService.trackClicksBatch(clicks);

    return {
      success: true,
      data: results,
      message: `${results.length} clicks tracked successfully`,
      total: results.length,
    };
  }

  @Get('items/:id/stats')
  async getItemStats(
    @Param('id') itemId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.analyticsService.getItemAnalytics(
      itemId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('trending')
  async getTrendingItems(
    @Query('limit') limit: string = '10',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const items = await this.analyticsService.getTrendingItems(
      parseInt(limit),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      success: true,
      data: items,
    };
  }

  @Get('user/:userId')
  async getUserAnalytics(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.analyticsService.getUserAnalytics(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('timeseries/:itemId')
  async getTimeSeriesData(
    @Param('itemId') itemId: string,
    @Query('days') days: string = '7',
  ) {
    const data = await this.analyticsService.getTimeSeriesData(
      itemId,
      parseInt(days),
    );
    return {
      success: true,
      data,
    };
  }

  @Get('dashboard')
  async getDashboardData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const trendingItems = await this.getTrendingItems(
      DEFAULT_TRENDING_ITEMS_LIMIT.toString(),
      startDate,
      endDate,
    );

    return {
      success: true,
      data: {
        trendingItems: trendingItems.data,
        period: {
          startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString(),
        },
      },
    };
  }
}
