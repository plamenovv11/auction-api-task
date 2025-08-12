import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TrackingSources } from '../dto/track-click.dto';

export type ImpressionEventDocument = ImpressionEvent & Document;

@Schema({ timestamps: true })
export class ImpressionEvent {
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

  @Prop({ required: true })
  timestamp: Date;
}

export const ImpressionEventSchema = SchemaFactory.createForClass(ImpressionEvent);

// Set collection name
ImpressionEventSchema.set('collection', 'impression_events');

// Indexes for analytics queries
ImpressionEventSchema.index({ item_id: 1, timestamp: -1 });
ImpressionEventSchema.index({ session_id: 1, timestamp: -1 });
ImpressionEventSchema.index({ user_id: 1, timestamp: -1 });
ImpressionEventSchema.index({ source: 1, timestamp: -1 });
ImpressionEventSchema.index({ timestamp: -1 });
ImpressionEventSchema.index({ session_id: 1, item_id: 1 }); // For deduplication

// TTL index for automatic document expiration (90 days)
ImpressionEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
