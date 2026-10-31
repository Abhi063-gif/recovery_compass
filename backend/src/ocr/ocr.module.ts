import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { TesseractProvider } from './providers/tesseract.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PdfValidationService } from '../documents/pdf/pdf-validation.service';

@Module({
  imports: [ConfigModule],
  providers: [
    PdfValidationService,
    OcrService,
    TesseractProvider,
    {
      provide: 'OCR_PROVIDER',
      inject: [ConfigService, TesseractProvider],
      useFactory: (cfg: ConfigService, tesseract: TesseractProvider) => {
        return tesseract;
      },
    },
  ],
  exports: [OcrService, PdfValidationService],
})
export class OcrModule {}
