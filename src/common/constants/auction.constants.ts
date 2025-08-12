export enum AuctionCategory {
  CERAMICS = 'Ceramics',
  PAINTINGS = 'Paintings',
  JEWELRY = 'Jewelry',
  FURNITURE = 'Furniture',
  BOOKS = 'Books',
  LIGHTING = 'Lighting',
  ANTIQUITIES = 'Antiquities',
  DECORATIVE_ARTS = 'Decorative Arts',
  PRINTS = 'Prints',
  SCULPTURES = 'Sculptures',
  MUSICAL_INSTRUMENTS = 'Musical Instruments',
  ARMS_AND_ARMOR = 'Arms & Armor',
  TEXTILES = 'Textiles',
  SILVER = 'Silver',
  COINS = 'Coins',
  RELIGIOUS_ART = 'Religious Art',
  FOLK_ART = 'Folk Art',
  WATCHES = 'Watches'
}

export enum AuctionStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export const DEFAULT_AUCTION_CATEGORY = 'Ceramics';
export const DEFAULT_AUCTION_STATUS = 'upcoming';

export const AUCTION_CATEGORIES = Object.values(AuctionCategory);
export const AUCTION_STATUSES = Object.values(AuctionStatus);

export const AUCTION_CATEGORIES_LOWER = AUCTION_CATEGORIES.map(cat => cat.toLowerCase());
export const AUCTION_STATUSES_LOWER = AUCTION_STATUSES.map(status => status.toLowerCase());
