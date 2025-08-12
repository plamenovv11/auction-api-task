import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class PaginationService {
  static async paginate<T extends Document>(
    model: Model<T>,
    filterQuery: any = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const sortQuery: any = {};
    sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, totalItems] = await Promise.all([
      model
        .find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      model.countDocuments(filterQuery).exec()
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext,
        hasPrev
      }
    };
  }

  static async paginateAggregate<T>(
    model: Model<any>,
    pipeline: any[],
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const sortQuery: any = {};
    sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const countPipeline = [
      ...pipeline,
      { $count: 'total' }
    ];

    const dataPipeline = [
      ...pipeline,
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit }
    ];

    const [countResult, data] = await Promise.all([
      model.aggregate(countPipeline).exec(),
      model.aggregate(dataPipeline).exec()
    ]);

    const totalItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext,
        hasPrev
      }
    };
  }
}
