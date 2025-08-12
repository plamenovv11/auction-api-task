import { Injectable, Logger, BadRequestException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImpressionEvent } from './schemas/impression-event.schema';
import { ClickEvent } from './schemas/click-event.schema';
import { TrackImpressionDto } from './dto/track-impression.dto';
import { TrackClickDto } from './dto/track-click.dto';
import { AnalyticsRepository, AnalyticsFilters } from './repositories/analytics.repository';

// TODO: cache can be moved to redis in future
interface AnalyticsConfig {
  RATE_LIMIT_WINDOW: number;
  IMPRESSION_COOLDOWN: number;
  CLICK_COOLDOWN: number;
  CLEANUP_INTERVAL: number;
  DATA_RETENTION_DAYS: number;
}

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly impressionCache = new Map<string, number>(); // session_item -> timestamp
  private readonly clickCache = new Map<string, number>(); // session_item -> timestamp
  private readonly config: AnalyticsConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private configService: ConfigService,
  ) {
    this.config = {
      RATE_LIMIT_WINDOW: this.configService.get('ANALYTICS_RATE_LIMIT_WINDOW', 60000),
      IMPRESSION_COOLDOWN: this.configService.get('ANALYTICS_IMPRESSION_COOLDOWN', 30000),
      CLICK_COOLDOWN: this.configService.get('ANALYTICS_CLICK_COOLDOWN', 5000),
      CLEANUP_INTERVAL: this.configService.get('ANALYTICS_CLEANUP_INTERVAL', 300000),
      DATA_RETENTION_DAYS: this.configService.get('ANALYTICS_DATA_RETENTION_DAYS', 90),
    };
  }

  onModuleInit() {
    // Clean cache every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanCache(this.impressionCache);
      this.cleanCache(this.clickCache);
    }, this.config.CLEANUP_INTERVAL);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async trackImpression(trackImpressionDto: TrackImpressionDto): Promise<ImpressionEvent> {
    const cacheKey = `${trackImpressionDto.session_id}_${trackImpressionDto.item_id}`;
    const now = Date.now();

    // Check rate limiting and deduplication
    if (this.impressionCache.has(cacheKey)) {
      const lastImpression = this.impressionCache.get(cacheKey);
      if (now - lastImpression < this.config.IMPRESSION_COOLDOWN) {
        this.logger.warn(`Rate limited impression for session ${trackImpressionDto.session_id}, item ${trackImpressionDto.item_id}`);
        throw new BadRequestException('Impression tracked too recently for this session and item');
      }
    }

    // Check if impression already exists in this session (within rate limit window)
    const startTime = new Date(now - this.config.RATE_LIMIT_WINDOW);
    const existingImpression = await this.analyticsRepository.findImpressionBySessionAndItem(
      trackImpressionDto.session_id,
      trackImpressionDto.item_id,
      startTime
    );

    if (existingImpression) {
      this.logger.warn(`Duplicate impression prevented for session ${trackImpressionDto.session_id}, item ${trackImpressionDto.item_id}`);
      throw new BadRequestException('Impression already tracked for this session and item');
    }

    const impressionData = {
      ...trackImpressionDto,
      timestamp: trackImpressionDto.timestamp ? new Date(trackImpressionDto.timestamp) : new Date(),
    };

    // Update cache and clean old cache entries 
    this.impressionCache.set(cacheKey, now);

    const result = await this.analyticsRepository.createImpression(impressionData);
    this.logger.log(`Impression tracked: ${trackImpressionDto.item_id} for session ${trackImpressionDto.session_id}`);

    return result;
  }

  async trackClick(trackClickDto: TrackClickDto): Promise<ClickEvent> {
    const cacheKey = `${trackClickDto.session_id}_${trackClickDto.item_id}`;
    const now = Date.now();

    // Check rate limiting and deduplication
    if (this.clickCache.has(cacheKey)) {
      const lastClick = this.clickCache.get(cacheKey);
      if (now - lastClick < this.config.CLICK_COOLDOWN) {
        this.logger.warn(`Rate limited click for session ${trackClickDto.session_id}, item ${trackClickDto.item_id}`);
        throw new BadRequestException('Click tracked too recently for this session and item');
      }
    }

    // Check if click already exists in this session (within rate limit window)
    const startTime = new Date(now - this.config.RATE_LIMIT_WINDOW);
    const existingClick = await this.analyticsRepository.findClickBySessionAndItem(
      trackClickDto.session_id,
      trackClickDto.item_id,
      startTime
    );

    if (existingClick) {
      this.logger.warn(`Duplicate click prevented for session ${trackClickDto.session_id}, item ${trackClickDto.item_id}`);
      throw new BadRequestException('Click already tracked for this session and item');
    }

    const clickData = {
      ...trackClickDto,
      timestamp: trackClickDto.timestamp ? new Date(trackClickDto.timestamp) : new Date(),
    };

    // Update cache and clean old cache entries
    this.clickCache.set(cacheKey, now);

    const result = await this.analyticsRepository.createClick(clickData);
    this.logger.log(`Click tracked: ${trackClickDto.item_id} for session ${trackClickDto.session_id}`);

    return result;
  }

  async trackImpressionsBatch(impressions: TrackImpressionDto[]): Promise<ImpressionEvent[]> {
    if (impressions.length === 0) return [];

    const validImpressions = [];
    const now = Date.now();
    const sessionItemPairs = impressions.map(imp => ({
      session_id: imp.session_id,
      item_id: imp.item_id
    }));

    const startTime = new Date(now - this.config.RATE_LIMIT_WINDOW);
    const existingImpressions = await this.analyticsRepository.findExistingImpressions(sessionItemPairs, startTime);

    const existingSet = new Set(
      existingImpressions.map(imp => `${imp.session_id}_${imp.item_id}`)
    );

    for (const impression of impressions) {
      const cacheKey = `${impression.session_id}_${impression.item_id}`;

      if (this.impressionCache.has(cacheKey)) {
        const lastImpression = this.impressionCache.get(cacheKey);
        if (now - lastImpression < this.config.IMPRESSION_COOLDOWN) {
          continue;
        }
      }

      if (existingSet.has(cacheKey)) {
        continue;
      }

      validImpressions.push({
        ...impression,
        timestamp: impression.timestamp ? new Date(impression.timestamp) : new Date(),
      });

      this.impressionCache.set(cacheKey, now);
    }

    if (validImpressions.length === 0) {
      return [];
    }

    const results = await this.analyticsRepository.createImpressionsBatch(validImpressions);
    this.logger.log(`Batch tracked ${results.length} impressions`);

    return results;
  }

  async trackClicksBatch(clicks: TrackClickDto[]): Promise<ClickEvent[]> {
    if (clicks.length === 0) return [];

    const validClicks = [];
    const now = Date.now();
    const sessionItemPairs = clicks.map(click => ({
      session_id: click.session_id,
      item_id: click.item_id
    }));

    const startTime = new Date(now - this.config.RATE_LIMIT_WINDOW);
    const existingClicks = await this.analyticsRepository.findExistingClicks(sessionItemPairs, startTime);

    const existingSet = new Set(
      existingClicks.map(click => `${click.session_id}_${click.item_id}`)
    );

    for (const click of clicks) {
      const cacheKey = `${click.session_id}_${click.item_id}`;

      // Skip if rate limited in cache or already exists in database
      if (this.clickCache.has(cacheKey)) {
        const lastClick = this.clickCache.get(cacheKey);
        if (now - lastClick < this.config.CLICK_COOLDOWN) {
          continue;
        }
      }

      if (existingSet.has(cacheKey)) {
        continue;
      }

      validClicks.push({
        ...click,
        timestamp: click.timestamp ? new Date(click.timestamp) : new Date(),
      });

      this.clickCache.set(cacheKey, now);
    }

    if (validClicks.length === 0) {
      return [];
    }

    const results = await this.analyticsRepository.createClicksBatch(validClicks);
    this.logger.log(`Batch tracked ${results.length} clicks`);

    return results;
  }

  private cleanCache(cache: Map<string, number>): void {
    const now = Date.now();
    const cutoff = now - this.config.RATE_LIMIT_WINDOW;

    for (const [key, timestamp] of cache.entries()) {
      if (timestamp < cutoff) {
        cache.delete(key);
      }
    }
  }

  // Data retention: Clean old events (older than configured days)
  // TODO: Use @nestjs/schedule for production-ready scheduled cleanup
  async cleanOldEvents(daysToKeep?: number): Promise<{ impressions: number; clicks: number }> {
    const days = daysToKeep || this.config.DATA_RETENTION_DAYS;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [impressionsDeleted, clicksDeleted] = await Promise.all([
      this.analyticsRepository.deleteOldImpressions(cutoffDate),
      this.analyticsRepository.deleteOldClicks(cutoffDate)
    ]);

    this.logger.log(`Cleaned ${impressionsDeleted.deletedCount} old impressions and ${clicksDeleted.deletedCount} old clicks`);

    return {
      impressions: impressionsDeleted.deletedCount,
      clicks: clicksDeleted.deletedCount
    };
  }

  async getItemAnalytics(itemId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const filters: AnalyticsFilters = { item_id: itemId, startDate, endDate };

    const [impressions, clicks] = await Promise.all([
      this.analyticsRepository.countImpressionsByFilter(filters),
      this.analyticsRepository.countClicksByFilter(filters),
    ]);

    const uniqueUsers = await this.analyticsRepository.getDistinctUsersByFilter(filters);
    const uniqueSessions = await this.analyticsRepository.getDistinctSessionsByFilter(filters);

    return {
      itemId,
      impressions,
      clicks,
      uniqueUsers: uniqueUsers.length,
      uniqueSessions: uniqueSessions.length,
      clickThroughRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  }

  async getTrendingItems(limit: number = 10, startDate?: Date, endDate?: Date): Promise<any[]> {
    const filters: AnalyticsFilters = { startDate, endDate };
    return this.analyticsRepository.getPopularItemsAggregation(limit, filters);
  }

  async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const filters: AnalyticsFilters = { user_id: userId, startDate, endDate };

    const [impressions, clicks] = await Promise.all([
      this.analyticsRepository.countImpressionsByFilter(filters),
      this.analyticsRepository.countClicksByFilter(filters),
    ]);

    const viewedItems = await this.analyticsRepository.getDistinctItemsByFilter(filters);
    const clickedItems = await this.analyticsRepository.getDistinctItemsByFilter(filters);

    return {
      userId,
      impressions,
      clicks,
      viewedItems: viewedItems.length,
      clickedItems: clickedItems.length,
      clickThroughRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  }

  async getTimeSeriesData(itemId: string, days: number = 7): Promise<any> {
    const [impressions, clicks] = await Promise.all([
      this.analyticsRepository.getTimeSeriesData(itemId, days),
      this.analyticsRepository.getClickTimeSeriesData(itemId, days),
    ]);

    return { impressions, clicks };
  }
}
