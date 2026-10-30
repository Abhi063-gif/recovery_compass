import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { SupabaseStorageProvider } from './providers/supabase-storage.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StorageService,
    LocalStorageProvider,
    S3StorageProvider,
    SupabaseStorageProvider,
    {
      provide: 'STORAGE_PROVIDER',
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider, SupabaseStorageProvider],
      useFactory: (
        cfg: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
        supabaseStorage: SupabaseStorageProvider,
      ) => {
        const provider = cfg.get<string>('STORAGE_PROVIDER', 'local');
        switch (provider) {
          case 'supabase':
            return supabaseStorage;
          case 's3':
            return s3;
          case 'local':
          default:
            return local;
        }
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
