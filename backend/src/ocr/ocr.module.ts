import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { TesseractProvider } from './providers/tesseract.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    OcrService,
    TesseractProvider,
    {
      provide: 'OCR_PROVIDER',
      inject: [ConfigService, TesseractProvider],
      useFactory: (cfg: ConfigService, tesseract: TesseractProvider) => {
        const provider = cfg.get<string>('OCR_PROVIDER', 'tesseract');
        // Pluggable: add more providers here (google-vision, azure, etc.)
        return tesseract;
      },
    },
  ],
  exports: [OcrService],
})
export class OcrModule {}
