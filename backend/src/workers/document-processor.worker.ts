import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DocumentPipelineRunner } from '../queue/document-pipeline.runner';
import { LoggerService } from '../common/logger/logger.service';
import { DOCUMENT_PROCESSING_QUEUE, JOBS } from './queue.constants';

/**
 * Bull Queue Document Processing Worker.
 * Delegates to the unified, idempotent DocumentPipelineRunner.
 */
@Processor(DOCUMENT_PROCESSING_QUEUE)
export class DocumentProcessorWorker {
  constructor(
    private readonly pipelineRunner: DocumentPipelineRunner,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DocumentProcessorWorker.name);
  }

  @Process(JOBS.PROCESS_DOCUMENT)
  async processDocument(job: Job<{ documentId: string; patientProfileId: string }>) {
    const { documentId, patientProfileId } = job.data;
    this.logger.log(`Worker processing document ${documentId} (attempt ${job.attemptsMade + 1})`);

    const result = await this.pipelineRunner.execute(documentId, patientProfileId);
    if (!result.success) {
      this.logger.warn(`Document ${documentId} pipeline completed with non-success status: ${result.status}`);
    }
  }
}
