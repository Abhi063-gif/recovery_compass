import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor(private readonly cfg: ConfigService) {
    this.basePath = cfg.get<string>('LOCAL_STORAGE_PATH', './uploads');
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key);
    return fs.readFileSync(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    // For local development, return a path-based URL
    const baseUrl = this.cfg.get<string>('APP_BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/api/v1/files/${encodeURIComponent(key)}?expires=${Date.now() + (expiresInSeconds ?? 3600) * 1000}`;
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key);
    return fs.existsSync(fullPath);
  }
}
