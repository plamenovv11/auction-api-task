import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService, ImportResult } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) { }

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importFromExcel(@UploadedFile() file: any): Promise<{
    success: boolean;
    data: ImportResult;
    message: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('File must be an Excel file (.xlsx or .xls)');
    }

    const result = await this.importService.importFromExcel(file.buffer);

    return {
      success: result.success,
      data: result,
      message: result.success
        ? `Successfully imported ${result.imported} items`
        : `Import completed with ${result.errors.length} errors and ${result.warnings.length} warnings`
    };
  }

  @Post('csv')
  @HttpCode(HttpStatus.OK)
  async importFromCSV(@Body() body: { csvData: string }): Promise<{
    success: boolean;
    data: ImportResult;
    message: string;
  }> {
    if (!body.csvData) {
      throw new BadRequestException('CSV data is required');
    }

    const result = await this.importService.importFromCSV(body.csvData);

    return {
      success: result.success,
      data: result,
      message: result.success
        ? `Successfully imported ${result.imported} items`
        : `Import completed with ${result.errors.length} errors and ${result.warnings.length} warnings`
    };
  }
}
