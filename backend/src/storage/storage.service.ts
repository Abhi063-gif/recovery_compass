import { Injectable, Inject } from '@nestjs/common';
import { StorageProvider } from './storage.interface';

@Injectable()
export class StorageService {
  constructor(@Inject('STORAGE_PROVIDER') private readonly provider: StorageProvider) {}

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.provider.upload(key, buffer, mimeType);
  }

  async download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  /**
   * Generate a storage key for a document.
   * Format: documents/{patientId}/{docId}/{filename}
   * Never exposes raw credentials — only keys are stored.
   */
  buildDocumentKey(patientId: string, docId: string, filename: string): string {
    return `documents/${patientId}/${docId}/${filename}`;
  }
}
