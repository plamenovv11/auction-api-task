import { IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { TrackingSources } from './track-click.dto';

export class TrackImpressionDto {
  @IsString()
  item_id: string;

  @IsString()
  session_id: string;

  @IsOptional()
  @IsString()
  user_id?: string; // optional, for logged-in users

  @IsEnum(TrackingSources)
  source: TrackingSources;

  @IsOptional()
  @IsString()
  search_query?: string; // if from search

  @IsOptional()
  @IsNumber()
  position_in_results?: number; // position in search results or listing

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
