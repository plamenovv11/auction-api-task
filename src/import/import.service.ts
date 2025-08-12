import { Injectable } from '@nestjs/common';
import { AuctionService } from '../auction/auction.service';
import { CreateAuctionItemDto } from '../auction/dto/create-auction-item.dto';
import { AUCTION_CATEGORIES_LOWER, AUCTION_STATUSES_LOWER, AUCTION_CATEGORIES, AUCTION_STATUSES, AuctionCategory, AuctionStatus, DEFAULT_AUCTION_CATEGORY, DEFAULT_AUCTION_STATUS } from '../common/constants/auction.constants';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateTitles: number;
    priceRange: { min: number; max: number };
    categories: string[];
  };
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

const REQUIRED_HEADERS = ['Title', 'Description', 'Category', 'Price', 'Status'];

@Injectable()
export class ImportService {
  constructor(private readonly auctionService: AuctionService) { }

  async importFromExcel(fileBuffer: Buffer): Promise<ImportResult> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        return {
          success: false,
          imported: 0,
          errors: [{ row: 0, field: 'data', value: null, message: 'Excel file is empty or has no data rows', severity: 'error' }],
          warnings: [],
          summary: { totalRows: 0, validRows: 0, invalidRows: 0, duplicateTitles: 0, priceRange: { min: 0, max: 0 }, categories: [] }
        };
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      return await this.processImportData(headers, dataRows);
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'file', value: null, message: `Failed to read Excel file: ${error.message}`, severity: 'error' }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, invalidRows: 0, duplicateTitles: 0, priceRange: { min: 0, max: 0 }, categories: [] }
      };
    }
  }

  async importFromCSV(csvData: string): Promise<ImportResult> {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'data', value: null, message: 'CSV data is empty or has no data rows', severity: 'error' }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, invalidRows: 0, duplicateTitles: 0, priceRange: { min: 0, max: 0 }, categories: [] }
      };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1).map(line => this.parseCSVLine(line));

    return await this.processImportData(headers, dataRows);
  }

  private async processImportData(headers: string[], dataRows: any[]): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const validItems: CreateAuctionItemDto[] = [];
    const titles = new Set<string>();
    const duplicateTitles = new Set<string>();
    const categories = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    const missingHeaders = REQUIRED_HEADERS.filter(header =>
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        field: 'headers',
        value: headers,
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        severity: 'error'
      });
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we start from row 2 (after headers)

      const rowResult = this.processRow(row, headers, rowNumber, titles, categories, duplicateTitles, minPrice, maxPrice);

      errors.push(...rowResult.errors);
      warnings.push(...rowResult.warnings);

      if (rowResult.item) {
        validItems.push(rowResult.item);
        minPrice = rowResult.minPrice;
        maxPrice = rowResult.maxPrice;
      }
    }

    // Import valid items
    let imported = 0;
    if (validItems.length > 0) {
      try {
        await this.auctionService.bulkCreate(validItems);
        imported = validItems.length;
      } catch (error) {
        errors.push({
          row: 0,
          field: 'bulk_import',
          value: null,
          message: `Bulk import failed: ${error.message}`,
          severity: 'error'
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0 && imported > 0,
      imported,
      errors,
      warnings,
      summary: {
        totalRows: dataRows.length,
        validRows: validItems.length,
        invalidRows: dataRows.length - validItems.length,
        duplicateTitles: duplicateTitles.size,
        priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice === -Infinity ? 0 : maxPrice },
        categories: Array.from(categories)
      }
    };
  }

  private validateRow(rowData: any, rowNumber: number, existingTitles: Set<string>): {
    isValid: boolean;
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    const title = rowData.Title || rowData.title;
    if (!title || title.toString().trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'Title',
        value: title,
        message: 'Title is required',
        severity: 'error'
      });
    } else if (title.toString().length > 200) {
      errors.push({
        row: rowNumber,
        field: 'Title',
        value: title,
        message: 'Title must be less than 200 characters',
        severity: 'error'
      });
    } else if (existingTitles.has(title.toString().trim())) {
      warnings.push({
        row: rowNumber,
        field: 'Title',
        value: title,
        message: 'Duplicate title found'
      });
    }

    const description = rowData.Description || rowData.description;
    if (description && description.toString().length > 1000) {
      errors.push({
        row: rowNumber,
        field: 'Description',
        value: description,
        message: 'Description must be less than 1000 characters',
        severity: 'error'
      });
    }

    const category = rowData.Category || rowData.category;
    if (!category || category.toString().trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'Category',
        value: category,
        message: 'Category is required',
        severity: 'error'
      });
    } else {
      if (!AUCTION_CATEGORIES_LOWER.includes(category.toString().toLowerCase())) {
        warnings.push({
          row: rowNumber,
          field: 'Category',
          value: category,
          message: `Category '${category}' is not in the standard list`
        });
      }
    }

    const price = rowData.Price || rowData.price;
    if (!price || isNaN(parseFloat(price))) {
      errors.push({
        row: rowNumber,
        field: 'Price',
        value: price,
        message: 'Price must be a valid number',
        severity: 'error'
      });
    } else {
      const priceNum = parseFloat(price);
      if (priceNum < 0) {
        errors.push({
          row: rowNumber,
          field: 'Price',
          value: price,
          message: 'Price must be positive',
          severity: 'error'
        });
      } else if (priceNum > 10000000) {
        warnings.push({
          row: rowNumber,
          field: 'Price',
          value: price,
          message: 'Price seems unusually high (>10M)'
        });
      }
    }

    const status = rowData.Status || rowData.status;
    if (status) {
      if (!AUCTION_STATUSES_LOWER.includes(status.toString().toLowerCase())) {
        warnings.push({
          row: rowNumber,
          field: 'Status',
          value: status,
          message: `Status '${status}' is not standard. Using 'upcoming' as default.`
        });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  private mapRowToAuctionItem(rowData: any): CreateAuctionItemDto {
    const categoryStr = (rowData.Category || rowData.category || '').toString().trim();
    const statusStr = (rowData.Status || rowData.status || 'upcoming').toString().toLowerCase();

    const category = AUCTION_CATEGORIES_LOWER.includes(categoryStr.toLowerCase())
      ? AUCTION_CATEGORIES.find(cat => cat.toLowerCase() === categoryStr.toLowerCase())!
      : DEFAULT_AUCTION_CATEGORY as AuctionCategory;

    const status = AUCTION_STATUSES_LOWER.includes(statusStr)
      ? AUCTION_STATUSES.find(s => s.toLowerCase() === statusStr)!
      : DEFAULT_AUCTION_STATUS as AuctionStatus;

    return {
      title: (rowData.Title || rowData.title || '').toString().trim(),
      description: (rowData.Description || rowData.description || '').toString().trim(),
      category,
      price: parseFloat(rowData.Price || rowData.price || '0'),
      status,
      created_at: new Date().toISOString()
    };
  }

  private processRow(
    row: any[],
    headers: string[],
    rowNumber: number,
    titles: Set<string>,
    categories: Set<string>,
    duplicateTitles: Set<string>,
    minPrice: number,
    maxPrice: number
  ): {
    item?: CreateAuctionItemDto;
    errors: ImportError[];
    warnings: ImportWarning[];
    minPrice: number;
    maxPrice: number;
  } {
    if (row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
      return { errors: [], warnings: [], minPrice, maxPrice }; // Skip empty rows
    }

    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });

    const validationResult = this.validateRow(rowData, rowNumber, titles);

    if (validationResult.isValid) {
      const item = this.mapRowToAuctionItem(rowData);

      // Track statistics
      if (titles.has(item.title)) {
        duplicateTitles.add(item.title);
      }
      titles.add(item.title);
      categories.add(item.category);

      const newMinPrice = item.price < minPrice ? item.price : minPrice;
      const newMaxPrice = item.price > maxPrice ? item.price : maxPrice;

      return {
        item,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice
      };
    }

    return {
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      minPrice,
      maxPrice
    };
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }
}
