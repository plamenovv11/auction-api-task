import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionItemDto } from './dto/create-auction-item.dto';
import { UpdateAuctionItemDto } from './dto/update-auction-item.dto';
import { SearchAuctionItemsDto } from './dto/search-auction-items.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { TrackImpressionDto } from '../analytics/dto/track-impression.dto';
import { TrackClickDto } from '../analytics/dto/track-click.dto';
import { AuctionTrackingService } from './services/auction-tracking.service';
import { SessionInterceptor } from '../common/interceptors/session.interceptor';
import { Session, SessionInfo } from '../common/decorators/session.decorator';

@Controller('auction-items')
@UseInterceptors(SessionInterceptor)
export class AuctionController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly analyticsService: AnalyticsService,
    private readonly trackingService: AuctionTrackingService,
  ) { }

  @Get()
  async findAll(@Session() session: SessionInfo, @Query() searchDto: SearchAuctionItemsDto) {
    const trackingContext = session.sessionId ?
      this.trackingService.createSearchContext(session.sessionId, session.userId) :
      undefined;

    const result = await this.auctionService.searchAndPaginate(searchDto, trackingContext);

    return {
      success: true,
      data: result.data,
      count: result.data.length,
      pagination: result.pagination,
      filters: result.filters,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Session() session: SessionInfo,
    @Query('includeAnalytics') includeAnalytics?: boolean,
    @Query('includeRelated') includeRelated?: boolean
  ) {
    const trackingContext = session.sessionId ?
      this.trackingService.createDirectContext(session.sessionId, session.userId) :
      undefined;

    const item = await this.auctionService.findOne(id, {
      includeAnalytics: includeAnalytics === true,
      includeRelated: includeRelated === true,
      trackingContext
    });

    return {
      success: true,
      data: item,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuctionItemDto: CreateAuctionItemDto) {
    const item = await this.auctionService.create(createAuctionItemDto);

    return {
      success: true,
      data: item,
      message: 'Auction item created successfully',
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateAuctionItemDto: UpdateAuctionItemDto
  ) {
    const item = await this.auctionService.update(id, updateAuctionItemDto);

    return {
      success: true,
      data: item,
      message: 'Auction item updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.auctionService.remove(id);
  }

  @Post(':id/impression')
  @HttpCode(HttpStatus.OK)
  async trackImpression(
    @Param('id') id: string,
    @Session() session: SessionInfo,
    @Body() trackImpressionDto: TrackImpressionDto
  ) {
    if (session.sessionId && !trackImpressionDto.session_id) {
      trackImpressionDto.session_id = session.sessionId;
    }

    trackImpressionDto.item_id = id;

    const impression = await this.analyticsService.trackImpression(trackImpressionDto);

    return {
      success: true,
      data: impression,
      message: 'Impression tracked successfully',
    };
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  async trackClick(
    @Param('id') id: string,
    @Session() session: SessionInfo,
    @Body() trackClickDto: TrackClickDto
  ) {
    if (session.sessionId && !trackClickDto.session_id) {
      trackClickDto.session_id = session.sessionId;
    }

    trackClickDto.item_id = id;

    const click = await this.analyticsService.trackClick(trackClickDto);

    return {
      success: true,
      data: click,
      message: 'Click tracked successfully',
    };
  }
}
