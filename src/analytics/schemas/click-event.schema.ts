import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TrackingSources } from '../dto/track-click.dto';

export type ClickEventDocument = ClickEvent & Document;

@Schema({ timestamps: true })
export class ClickEvent {
  @Prop({ required: true })
  item_id: string;

  @Prop({ required: true })
  session_id: string;

  @Prop({ required: false })
  user_id?: string;

  @Prop({ required: true, enum: TrackingSources })
  source: TrackingSources;

  @Prop({ required: false })
  search_query?: string;

  @Prop({ required: false })
  position_in_results?: number;

  @Prop({ required: true })
  timestamp: Date;
}

export const ClickEventSchema = SchemaFactory.createForClass(ClickEvent);

ClickEventSchema.set('collection', 'click_events');

ClickEventSchema.index({ item_id: 1, timestamp: -1 });
ClickEventSchema.index({ session_id: 1, timestamp: -1 });
ClickEventSchema.index({ user_id: 1, timestamp: -1 });
ClickEventSchema.index({ source: 1, timestamp: -1 });
ClickEventSchema.index({ timestamp: -1 });
ClickEventSchema.index({ session_id: 1, item_id: 1 }); // For deduplication

// TTL index for automatic document expiration (90 days)
ClickEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
