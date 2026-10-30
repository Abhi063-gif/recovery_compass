import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentQualityService } from './quality/document-quality.service';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { DOCUMENT_PROCESSING_QUEUE } from '../workers/queue.constants';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        storage: memoryStorage(), // Files processed in memory before secure upload
        limits: {
          fileSize: cfg.get<number>('MAX_FILE_SIZE_MB', 20) * 1024 * 1024,
          files: 1,
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = cfg
            .get<string>('ALLOWED_MIME_TYPES', 'application/pdf,image/jpeg,image/png')
            .split(',');
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
          }
        },
      }),
    }),
    BullModule.registerQueue({ name: DOCUMENT_PROCESSING_QUEUE }),
    StorageModule,
    AuditModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentQualityService],
  exports: [DocumentsService, DocumentQualityService],
})
export class DocumentsModule {}
