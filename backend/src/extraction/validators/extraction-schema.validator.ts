import { Injectable } from '@nestjs/common';
import { RootExtractionSchema, RootExtraction } from '../schemas/extraction.schema';
import { ZodError } from 'zod';

export interface ValidationResult {
  valid: boolean;
  data?: RootExtraction;
  errors?: string[];
}

/**
 * Extraction Schema Validator.
 *
 * This is the safety gate between LLM output and the database.
 * If validation fails, extraction is rejected — not stored.
 */
@Injectable()
export class ExtractionSchemaValidator {
  validate(rawData: unknown): ValidationResult {
    const result = RootExtractionSchema.safeParse(rawData);

    if (result.success) {
      return { valid: true, data: result.data };
    }

    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );

    return { valid: false, errors };
  }

  validateOrThrow(rawData: unknown): RootExtraction {
    const result = this.validate(rawData);
    if (!result.valid || !result.data) {
      throw new Error(
        `Extraction schema validation failed: ${result.errors?.join('; ')}`,
      );
    }
    return result.data;
  }
}
