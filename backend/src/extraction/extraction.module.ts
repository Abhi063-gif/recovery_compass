import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { LlmExtractionService } from './llm/llm-extraction.service';
import { GeminiExtractionProvider } from './llm/providers/gemini.provider';
import { ExtractionSchemaValidator } from './validators/extraction-schema.validator';
import { OcrModule } from '../ocr/ocr.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [OcrModule, AuditModule],
  controllers: [ExtractionController],
  providers: [
    ExtractionService,
    LlmExtractionService,
    GeminiExtractionProvider, // Registered for DI into LlmExtractionService
    ExtractionSchemaValidator,
  ],
  exports: [ExtractionService],
})
export class ExtractionModule {}
