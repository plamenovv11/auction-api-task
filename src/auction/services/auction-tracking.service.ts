import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from '../../analytics/analytics.service';
import { TrackImpressionDto } from '../../analytics/dto/track-impression.dto';
import { TrackClickDto } from '../../analytics/dto/track-click.dto';
import { TrackingSources } from '../../analytics/dto/track-click.dto';

export interface TrackingContext {
  session_id: string;
  source: TrackingSources;
  position_in_results?: number;
  user_id?: string;
}

@Injectable()
export class AuctionTrackingService {
  private readonly logger = new Logger(AuctionTrackingService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  async trackItemImpression(
    itemId: string,
    context: TrackingContext,
    timestamp?: Date
  ): Promise<void> {
    try {
      const impressionDto: TrackImpressionDto = {
        item_id: itemId,
        session_id: context.session_id,
        source: context.source,
        user_id: context.user_id,
        timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
      };

      await this.analyticsService.trackImpression(impressionDto);
      this.logger.debug(`Impression tracked for item ${itemId} in session ${context.session_id}`);
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.warn(`Failed to track impression for item ${itemId}: ${error.message}`);
    }
  }

  async trackItemsImpressions(
    itemIds: string[],
    context: TrackingContext,
    timestamp?: Date
  ): Promise<void> {
    if (itemIds.length === 0) return;

    try {
      const impressions: TrackImpressionDto[] = itemIds.map((itemId, index) => ({
        item_id: itemId,
        session_id: context.session_id,
        source: context.source,
        user_id: context.user_id,
        timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
        position_in_results: context.position_in_results !== undefined 
          ? context.position_in_results + index 
          : undefined,
      }));

      await this.analyticsService.trackImpressionsBatch(impressions);
      this.logger.debug(`Batch tracked ${impressions.length} impressions for session ${context.session_id}`);
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.warn(`Failed to batch track impressions: ${error.message}`);
    }
  }

  async trackItemClick(
    itemId: string,
    context: TrackingContext,
    timestamp?: Date
  ): Promise<void> {
    try {
      const clickDto: TrackClickDto = {
        item_id: itemId,
        session_id: context.session_id,
        source: context.source,
        user_id: context.user_id,
        timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
        position_in_results: context.position_in_results,
      };

      await this.analyticsService.trackClick(clickDto);
      this.logger.debug(`Click tracked for item ${itemId} in session ${context.session_id}`);
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.warn(`Failed to track click for item ${itemId}: ${error.message}`);
    }
  }

  createSearchContext(
    sessionId: string,
    userId?: string,
    positionOffset: number = 0
  ): TrackingContext {
    return {
      session_id: sessionId,
      source: TrackingSources.SEARCH,
      position_in_results: positionOffset,
      user_id: userId,
    };
  }

  createDirectContext(
    sessionId: string,
    userId?: string
  ): TrackingContext {
    return {
      session_id: sessionId,
      source: TrackingSources.DIRECT,
      user_id: userId,
    };
  }
}

