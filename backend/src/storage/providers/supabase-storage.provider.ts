import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSupabaseAdmin } from '../../lib/supabase';
import { StorageProvider } from '../storage.interface';

/**
 * Supabase Storage Provider
 *
 * Uses the service-role client to access private buckets.
 * Documents are stored at: patients/{patientId}/documents/{docId}/{filename}
 *
 * NEVER makes the bucket public.
 * NEVER exposes the service role key — all signed URLs are generated server-side.
 */
@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  private readonly bucket: string;

  constructor(private readonly cfg: ConfigService) {
    this.bucket = cfg.get<string>('SUPABASE_STORAGE_BUCKET', 'discharge-documents');
  }

  private get storage() {
    return getSupabaseAdmin().storage.from(this.bucket);
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.storage.upload(key, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return key;
  }

  async download(key: string): Promise<Buffer> {
    const { data, error } = await this.storage.download(key);

    if (error || !data) {
      throw new Error(`Supabase Storage download failed: ${error?.message || 'File not found'}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.storage.remove([key]);

    if (error) {
      throw new Error(`Supabase Storage delete failed: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.storage.createSignedUrl(key, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.storage.list(key.split('/').slice(0, -1).join('/'), {
        search: key.split('/').pop(),
      });
      return !error && data !== null && data.length > 0;
    } catch {
      return false;
    }
  }
}
