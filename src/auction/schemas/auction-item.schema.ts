import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuctionCategory, AuctionStatus } from '../../common/constants/auction.constants';

export type AuctionItemDocument = AuctionItem & Document;

@Schema({ timestamps: true })
export class AuctionItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, enum: AuctionCategory })
  category: AuctionCategory;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, enum: AuctionStatus, default: AuctionStatus.UPCOMING })
  status: AuctionStatus;

  @Prop({ required: true, default: Date.now })
  created_at: Date;
}

export const AuctionItemSchema = SchemaFactory.createForClass(AuctionItem);

AuctionItemSchema.set('collection', 'auction_items');

AuctionItemSchema.index({ category: 1 });
AuctionItemSchema.index({ status: 1 });
AuctionItemSchema.index({ price: 1 });
AuctionItemSchema.index({ created_at: -1 });
