import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}
