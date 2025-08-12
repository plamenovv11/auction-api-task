import { Injectable, NotFoundException } from '@nestjs/common';
import { AuctionItem } from './schemas/auction-item.schema';
import { CreateAuctionItemDto } from './dto/create-auction-item.dto';
import { UpdateAuctionItemDto } from './dto/update-auction-item.dto';
import { SearchAuctionItemsDto } from './dto/search-auction-items.dto';
import { PaginatedResult, PaginationOptions } from '../common/services/pagination.service';
import { AuctionItemRepository } from './repositories/auction-item.repository';
import { AuctionTrackingService, TrackingContext } from './services/auction-tracking.service';

@Injectable()
export class AuctionService {
  constructor(
    private readonly auctionItemRepository: AuctionItemRepository,
    private readonly trackingService: AuctionTrackingService,
  ) { }

  async findAll(paginationOptions: PaginationOptions = {}): Promise<PaginatedResult<AuctionItem>> {
    return this.auctionItemRepository.findAndPaginate({}, paginationOptions);
  }

  async searchAndPaginate(
    searchDto: SearchAuctionItemsDto,
    trackingContext?: TrackingContext
  ): Promise<PaginatedResult<AuctionItem> & { filters: any }> {
    const result = await this.auctionItemRepository.searchAndPaginate(searchDto);
    
    await this.trackSearchResults(result, trackingContext);

    return result;
  }

  async findOne(
    id: string, 
    options?: { 
      includeAnalytics?: boolean; 
      includeRelated?: boolean;
      trackingContext?: TrackingContext;
    }
  ): Promise<AuctionItem> {
    const item = await this.auctionItemRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Auction item with ID ${id} not found`);
    }

    await this.trackItemView(id, options?.trackingContext);

    return item;
  }

  async create(createAuctionItemDto: CreateAuctionItemDto): Promise<AuctionItem> {
    try {
      const itemData = {
        ...createAuctionItemDto,
        created_at: createAuctionItemDto.created_at ? new Date(createAuctionItemDto.created_at) : new Date(),
      };
      return await this.auctionItemRepository.create(itemData);
    } catch (error) {
      console.error('Error creating auction item:', error);
      throw error;
    }
  }

  async update(id: string, updateAuctionItemDto: UpdateAuctionItemDto): Promise<AuctionItem> {
    try {
      const updatedItem = await this.auctionItemRepository.update(id, updateAuctionItemDto);
      if (!updatedItem) {
        throw new NotFoundException(`Auction item with ID ${id} not found`);
      }
      return updatedItem;
    } catch (error) {
      console.error('Error updating auction item:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const deleted = await this.auctionItemRepository.delete(id);
      if (!deleted) {
        throw new NotFoundException(`Auction item with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Error deleting auction item:', error);
      throw error;
    }
  }

  async bulkCreate(items: CreateAuctionItemDto[]): Promise<any[]> {
    const itemsToCreate = items.map(item => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at) : new Date(),
    }));

    return this.auctionItemRepository.bulkCreate(itemsToCreate);
  }

  private async trackSearchResults(
    result: PaginatedResult<AuctionItem> & { filters: any },
    trackingContext?: TrackingContext
  ): Promise<void> {
    if (!trackingContext || result.data.length === 0) {
      return;
    }

    try {
      const itemIds = this.extractItemIds(result.data);
      await this.trackingService.trackItemsImpressions(itemIds, trackingContext);
    } catch (error) {
      // Log error but don't fail the main operation
      console.warn('Failed to track search results impressions:', error);
    }
  }

  private async trackItemView(
    itemId: string,
    trackingContext?: TrackingContext
  ): Promise<void> {
    if (!trackingContext) {
      return;
    }

    try {
      await this.trackingService.trackItemImpression(itemId, trackingContext);
    } catch (error) {
      // Log error but don't fail the main operation
      console.warn(`Failed to track item view impression for ${itemId}:`, error);
    }
  }

  private extractItemIds(items: AuctionItem[]): string[] {
    return items.map(item => {
      const doc = item as any;
      return doc._id?.toString() || doc.id || doc._id;
    });
  }
}
