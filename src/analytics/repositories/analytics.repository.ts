import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { ImpressionEvent, ImpressionEventDocument } from '../schemas/impression-event.schema';
import { ClickEvent, ClickEventDocument } from '../schemas/click-event.schema';
import { BaseRepository } from '../../common/repositories/base.repository';

export interface AnalyticsFilters {
  item_id?: string;
  user_id?: string;
  session_id?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(ImpressionEvent.name) private impressionModel: Model<ImpressionEventDocument>,
    @InjectModel(ClickEvent.name) private clickModel: Model<ClickEventDocument>,
  ) { }

  async createImpression(impressionData: Partial<ImpressionEvent>): Promise<ImpressionEvent> {
    const impression = new this.impressionModel(impressionData);
    return impression.save();
  }

  async createImpressionsBatch(impressions: Partial<ImpressionEvent>[]): Promise<ImpressionEvent[]> {
    return this.impressionModel.insertMany(impressions) as Promise<ImpressionEvent[]>;
  }

  async findImpressionBySessionAndItem(sessionId: string, itemId: string, startTime: Date): Promise<ImpressionEvent | null> {
    return this.impressionModel.findOne({
      session_id: sessionId,
      item_id: itemId,
      timestamp: { $gte: startTime }
    });
  }

  async findImpressionsByFilter(filters: AnalyticsFilters): Promise<ImpressionEvent[]> {
    const query = this.buildAnalyticsFilter(filters);
    return this.impressionModel.find(query).exec();
  }

  async countImpressionsByFilter(filters: AnalyticsFilters): Promise<number> {
    const query = this.buildAnalyticsFilter(filters);
    return this.impressionModel.countDocuments(query);
  }

  async getDistinctUsersByFilter(filters: AnalyticsFilters): Promise<string[]> {
    const query = this.buildAnalyticsFilter(filters);
    return this.impressionModel.distinct('user_id', query);
  }

  async getDistinctSessionsByFilter(filters: AnalyticsFilters): Promise<string[]> {
    const query = this.buildAnalyticsFilter(filters);
    return this.impressionModel.distinct('session_id', query);
  }

  async getDistinctItemsByFilter(filters: AnalyticsFilters): Promise<string[]> {
    const query = this.buildAnalyticsFilter(filters);
    return this.impressionModel.distinct('item_id', query);
  }

  async getPopularItemsAggregation(limit: number, filters: AnalyticsFilters): Promise<any[]> {
    const dateFilter = this.buildDateFilter(filters.startDate, filters.endDate);

    const pipeline: any[] = [];

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { timestamp: dateFilter } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$item_id',
          impressions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user_id' },
          uniqueSessions: { $addToSet: '$session_id' },
        },
      },
      {
        $project: {
          itemId: '$_id',
          impressions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueSessions: { $size: '$uniqueSessions' },
        },
      },
      { $sort: { impressions: -1 } },
      { $limit: limit }
    );

    return this.impressionModel.aggregate(pipeline);
  }

  async getTimeSeriesData(itemId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.impressionModel.aggregate([
      {
        $match: {
          item_id: itemId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async createClick(clickData: Partial<ClickEvent>): Promise<ClickEvent> {
    const click = new this.clickModel(clickData);
    return click.save();
  }

  async createClicksBatch(clicks: Partial<ClickEvent>[]): Promise<ClickEvent[]> {
    return this.clickModel.insertMany(clicks) as Promise<ClickEvent[]>;
  }

  async findClickBySessionAndItem(sessionId: string, itemId: string, startTime: Date): Promise<ClickEvent | null> {
    return this.clickModel.findOne({
      session_id: sessionId,
      item_id: itemId,
      timestamp: { $gte: startTime }
    });
  }

  async findClicksByFilter(filters: AnalyticsFilters): Promise<ClickEvent[]> {
    const query = this.buildAnalyticsFilter(filters);
    return this.clickModel.find(query).exec();
  }

  async countClicksByFilter(filters: AnalyticsFilters): Promise<number> {
    const query = this.buildAnalyticsFilter(filters);
    return this.clickModel.countDocuments(query);
  }

  async getClickTimeSeriesData(itemId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.clickModel.aggregate([
      {
        $match: {
          item_id: itemId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async findExistingImpressions(sessionItemPairs: Array<{ session_id: string, item_id: string }>, startTime: Date): Promise<ImpressionEvent[]> {
    return this.impressionModel.find({
      $or: sessionItemPairs.map(pair => ({
        session_id: pair.session_id,
        item_id: pair.item_id,
        timestamp: { $gte: startTime }
      }))
    });
  }

  async findExistingClicks(sessionItemPairs: Array<{ session_id: string, item_id: string }>, startTime: Date): Promise<ClickEvent[]> {
    return this.clickModel.find({
      $or: sessionItemPairs.map(pair => ({
        session_id: pair.session_id,
        item_id: pair.item_id,
        timestamp: { $gte: startTime }
      }))
    });
  }

  async deleteOldImpressions(cutoffDate: Date): Promise<{ deletedCount: number }> {
    const result = await this.impressionModel.deleteMany({ timestamp: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount };
  }

  async deleteOldClicks(cutoffDate: Date): Promise<{ deletedCount: number }> {
    const result = await this.clickModel.deleteMany({ timestamp: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount };
  }

  private buildAnalyticsFilter(filters: AnalyticsFilters): FilterQuery<ImpressionEvent | ClickEvent> {
    const query: FilterQuery<ImpressionEvent | ClickEvent> = {};

    if (filters.item_id) {
      query.item_id = filters.item_id;
    }

    if (filters.user_id) {
      query.user_id = filters.user_id;
    }

    if (filters.session_id) {
      query.session_id = filters.session_id;
    }

    if (filters.source) {
      query.source = filters.source;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = this.buildDateFilter(filters.startDate, filters.endDate);
    }

    return query;
  }

  private buildDateFilter(startDate?: Date, endDate?: Date): any {
    const dateFilter: any = {};

    if (startDate && startDate instanceof Date && !isNaN(startDate.getTime())) {
      dateFilter.$gte = startDate;
    }

    if (endDate && endDate instanceof Date && !isNaN(endDate.getTime())) {
      dateFilter.$lte = endDate;
    }

    return dateFilter;
  }
}
