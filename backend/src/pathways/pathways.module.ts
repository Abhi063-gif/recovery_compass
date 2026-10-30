import { Module } from '@nestjs/common';
import { PathwaysService } from './pathways.service';

@Module({
  providers: [PathwaysService],
  exports: [PathwaysService],
})
export class PathwaysModule {}
