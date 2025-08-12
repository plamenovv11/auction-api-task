import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { AuctionItem, AuctionItemDocument } from '../schemas/auction-item.schema';
import { BaseRepository } from '../../common/repositories/base.repository';
import { SearchAuctionItemsDto } from '../dto/search-auction-items.dto';
import { PaginatedResult, PaginationOptions } from '../../common/services/pagination.service';

export interface AuctionItemFilters {
  search?: string;
  category?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
}

@Injectable()
export class AuctionItemRepository extends BaseRepository<AuctionItemDocument> {
  constructor(
    @InjectModel(AuctionItem.name) auctionItemModel: Model<AuctionItemDocument>
  ) {
    super(auctionItemModel);
  }

  private buildSearchFilter(filters: AuctionItemFilters): FilterQuery<AuctionItem> {
    const {
      search,
      category,
      status,
      min_price,
      max_price,
      start_date,
      end_date,
    } = filters;

    const filterQuery: FilterQuery<AuctionItem> = {};

    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filterQuery.category = category;
    }

    if (status) {
      filterQuery.status = status;
    }

    if (min_price !== undefined || max_price !== undefined) {
      filterQuery.price = {};
      if (min_price !== undefined) {
        filterQuery.price.$gte = min_price;
      }
      if (max_price !== undefined) {
        filterQuery.price.$lte = max_price;
      }
    }

    if (start_date || end_date) {
      filterQuery.created_at = {};
      if (start_date) {
        filterQuery.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        filterQuery.created_at.$lte = new Date(end_date);
      }
    }

    return filterQuery;
  }

  async searchAndPaginate(searchDto: SearchAuctionItemsDto): Promise<PaginatedResult<AuctionItem> & { filters: any }> {
    const {
      search,
      category,
      status,
      min_price,
      max_price,
      start_date,
      end_date,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = searchDto;

    const filters = {
      search,
      category,
      status,
      min_price,
      max_price,
      start_date,
      end_date
    };

    const filterQuery = this.buildSearchFilter(filters);

    const paginationOptions: PaginationOptions = {
      page,
      limit,
      sortBy: sort_by,
      sortOrder: sort_order
    };

    const result = await this.findAndPaginate(filterQuery, paginationOptions);
    
    return {
      ...result,
      filters
    };
  }

  async bulkCreate(items: Partial<AuctionItem>[]): Promise<AuctionItem[]> {
    const result = await this.model.insertMany(items);
    return result as AuctionItem[];
  }
}
