import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentQualityService } from './quality/document-quality.service';
import { PdfValidationService } from './pdf/pdf-validation.service';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';

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
            .get<string>('ALLOWED_MIME_TYPES', 'application/pdf,image/jpeg,image/png,image/jpg')
            .split(',');
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
          }
        },
      }),
    }),
    StorageModule,
    AuditModule,
    UsersModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentQualityService, PdfValidationService],
  exports: [DocumentsService, DocumentQualityService, PdfValidationService],
})
export class DocumentsModule {}
