import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { PaginatedResult, PaginationOptions } from '../services/pagination.service';

export interface IBaseRepository<T extends Document> {
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  find(filter: FilterQuery<T>): Promise<T[]>;
  findAndPaginate(
    filter: FilterQuery<T>,
    paginationOptions: PaginationOptions
  ): Promise<PaginatedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async find(filter: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async findAndPaginate(
    filter: FilterQuery<T>,
    paginationOptions: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { PaginationService } = await import('../services/pagination.service');
    return PaginationService.paginate(this.model, filter, paginationOptions);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async findByIds(ids: string[]): Promise<T[]> {
    return this.model.find({ _id: { $in: ids } }).exec();
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<any> {
    return this.model.updateMany(filter, update, options).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return this.model.deleteMany(filter).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }

  async aggregateAndPaginate(
    pipeline: any[],
    paginationOptions: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const { PaginationService } = await import('../services/pagination.service');
    return PaginationService.paginateAggregate(this.model, pipeline, paginationOptions);
  }
}
