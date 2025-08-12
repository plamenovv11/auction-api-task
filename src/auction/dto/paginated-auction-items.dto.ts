import { AuctionItem } from '../schemas/auction-item.schema';

export class PaginatedAuctionItemsDto {
  success: boolean;
  data: AuctionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    applied: string[];
    available: {
      categories: string[];
      statuses: string[];
      auctionHouses: string[];
      priceRange: {
        min: number;
        max: number;
      };
    };
  };
}

